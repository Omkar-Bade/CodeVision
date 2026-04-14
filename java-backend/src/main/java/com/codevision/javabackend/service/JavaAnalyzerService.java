package com.codevision.javabackend.service;

import com.codevision.javabackend.model.*;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * JavaAnalyzerService — Parses raw Java source code using regex to extract:
 *   - Import statements
 *   - Class declarations (with inheritance, interfaces, access modifier)
 *   - Fields  (name, type, access modifier)
 *   - Methods (name, return type, parameters, access modifier)
 *   - Constructors (name, parameters, access modifier)
 *   - Object instantiations (new ClassName(...))
 *   - OOP concepts: variables, reference variables, method calls, control flow
 *
 * Design: regex-based only — no AST/parsing libraries used.
 */
@Service
public class JavaAnalyzerService {

    // ── Constants ──────────────────────────────────────────────────────

    private static final Set<String> PRIMITIVES = Set.of(
        "int", "long", "short", "byte", "float", "double", "char", "boolean", "void"
    );

    private static final Set<String> KEYWORDS = Set.of(
        "if", "else", "for", "while", "do", "switch", "case", "break",
        "continue", "return", "new", "this", "super", "class", "interface",
        "extends", "implements", "import", "package", "static", "final",
        "abstract", "public", "private", "protected", "null", "true", "false"
    );

    // ── Regex Patterns ─────────────────────────────────────────────────

    /** import java.util.Scanner; */
    private static final Pattern IMPORT_PATTERN = Pattern.compile(
        "^\\s*import\\s+([\\w.]+(?:\\*)?);",
        Pattern.MULTILINE
    );

    /** public class Foo extends Bar implements Baz { */
    private static final Pattern CLASS_PATTERN = Pattern.compile(
        "(public\\s+|abstract\\s+|final\\s+)*class\\s+(\\w+)" +
        "(?:\\s+extends\\s+(\\w+))?" +
        "(?:\\s+implements\\s+([\\w,\\s]+))?" +
        "\\s*\\{"
    );

    /**
     * Field: [access] [static] [final] type name [= ...] ;
     * Groups: 1=access, 2=static?, 3=final?, 4=type, 5=name
     */
    private static final Pattern FIELD_PATTERN = Pattern.compile(
        "^\\s*(public|private|protected)?" +
        "\\s*(static\\s+)?(final\\s+)?" +
        "([\\w<>\\[\\]]+)\\s+(\\w+)\\s*[;=]"
    );

    /**
     * Method: [access] [static] [abstract] returnType name(params) { / ;
     * Groups: 1=access, 2=static?, 3=abstract?, 4=returnType, 5=name, 6=params
     */
    private static final Pattern METHOD_PATTERN = Pattern.compile(
        "^\\s*(public|private|protected)?" +
        "\\s*(static\\s+)?(abstract\\s+)?" +
        "([\\w<>\\[\\]]+)\\s+(\\w+)\\s*\\(([^)]*)\\)\\s*[{;]"
    );

    /** Object creation: Type name = new ClassName(args) */
    private static final Pattern OBJECT_CREATION_PATTERN = Pattern.compile(
        "([\\w<>\\[\\]]+)\\s+(\\w+)\\s*=\\s*new\\s+(\\w+)\\s*\\(([^)]*)\\)"
    );

    /** Method calls: obj.method(args) */
    private static final Pattern METHOD_CALL_PATTERN = Pattern.compile(
        "(\\w+)\\s*\\.\\s*(\\w+)\\s*\\(([^)]*)\\)"
    );

    /** Generic variable declaration: [modifiers] type name [; or =] */
    private static final Pattern VAR_DECL_PATTERN = Pattern.compile(
        "(?:public|private|protected)?\\s*(?:static\\s+)?(?:final\\s+)?" +
        "([\\w<>\\[\\]]+)\\s+(\\w+)\\s*[;=]"
    );

    // ── Public API ─────────────────────────────────────────────────────

    public AnalyzeResponse analyze(String code) {
        AnalyzeResponse response = new AnalyzeResponse();
        response.setImports(extractImports(code));
        response.setClasses(extractClasses(code));
        response.setObjects(extractObjects(code));
        response.setConcepts(extractConcepts(code));
        return response;
    }

    // ── 1. Import Extraction ───────────────────────────────────────────

    /**
     * Finds all import statements and returns the fully-qualified class names.
     * Example: "import java.util.Scanner;" → "java.util.Scanner"
     */
    private List<String> extractImports(String code) {
        List<String> imports = new ArrayList<>();
        Matcher m = IMPORT_PATTERN.matcher(code);
        while (m.find()) {
            imports.add(m.group(1).trim());
        }
        return imports;
    }

    // ── 2. Class Extraction ────────────────────────────────────────────

    private List<ClassInfo> extractClasses(String code) {
        List<ClassInfo> classes = new ArrayList<>();
        Matcher matcher = CLASS_PATTERN.matcher(code);

        while (matcher.find()) {
            ClassInfo info = new ClassInfo();
            info.setName(matcher.group(2));

            // extends
            if (matcher.group(3) != null) {
                info.setInheritance(matcher.group(3).trim());
            }

            // implements (comma-separated)
            if (matcher.group(4) != null) {
                List<String> ifaces = new ArrayList<>();
                for (String iface : matcher.group(4).split(",")) {
                    String t = iface.trim();
                    if (!t.isEmpty()) ifaces.add(t);
                }
                info.setInterfaces(ifaces);
            }

            // Extract the class body text via brace-matching
            String body = extractBody(code, matcher.end() - 1);
            parseClassMembers(body, info);
            detectPolymorphism(info);
            detectEncapsulation(body, info);

            classes.add(info);
        }
        return classes;
    }

    /**
     * Brace-matches from openBraceIdx to extract everything inside the class body.
     */
    private String extractBody(String code, int openBraceIdx) {
        int depth = 0;
        int start = openBraceIdx;
        for (int i = openBraceIdx; i < code.length(); i++) {
            char c = code.charAt(i);
            if (c == '{') {
                if (depth == 0) start = i + 1;
                depth++;
            } else if (c == '}') {
                depth--;
                if (depth == 0) return code.substring(start, i);
            }
        }
        return code.substring(start);
    }

    // ── 3. Member Parsing ──────────────────────────────────────────────

    /**
     * Walks the class body line-by-line to extract fields, methods,
     * and constructors — each with its access modifier.
     */
    private void parseClassMembers(String body, ClassInfo info) {
        String className = info.getName();
        String[] lines = body.split("\n");

        // Build constructor regex once (uses the actual class name)
        Pattern ctorPattern = Pattern.compile(
            "^\\s*(public|private|protected)?\\s*" +
            Pattern.quote(className) +
            "\\s*\\(([^)]*)\\)\\s*\\{"
        );

        for (String rawLine : lines) {
            String line = rawLine.trim();

            // Skip blank lines and comments
            if (line.isEmpty() || line.startsWith("//") ||
                line.startsWith("/*") || line.startsWith("*")) {
                continue;
            }

            // ── Constructor ──────────────────────────────────────────
            Matcher ctorMatcher = ctorPattern.matcher(line);
            if (ctorMatcher.find()) {
                String access = resolveAccess(ctorMatcher.group(1));
                List<String> params = parseParams(ctorMatcher.group(2));
                info.getConstructors().add(new ConstructorInfo(className, params, access));
                continue;
            }

            // ── Method ───────────────────────────────────────────────
            Matcher methodMatcher = METHOD_PATTERN.matcher(line);
            if (methodMatcher.find()) {
                String methodName = methodMatcher.group(5);
                if (methodName.equals(className)) continue; // already caught as constructor

                String access     = resolveAccess(methodMatcher.group(1));
                String returnType = methodMatcher.group(4);
                List<String> params = parseParams(methodMatcher.group(6));

                info.getMethods().add(new MethodInfo(methodName, returnType, params, access));
                continue;
            }

            // ── Field ────────────────────────────────────────────────
            Matcher fieldMatcher = FIELD_PATTERN.matcher(line);
            if (fieldMatcher.find()) {
                String fieldName = fieldMatcher.group(5);
                String fieldType = fieldMatcher.group(4);
                String access    = resolveAccess(fieldMatcher.group(1));

                // Skip common false positives (control flow keywords, etc.)
                if (KEYWORDS.contains(fieldName)) continue;

                info.getFields().add(new FieldInfo(fieldName, fieldType, access));
            }
        }
    }

    /**
     * Parses a parameter list string into individual parameter strings.
     * "int a, String name" → ["int a", "String name"]
     * Empty or whitespace → empty list
     */
    private List<String> parseParams(String paramStr) {
        List<String> result = new ArrayList<>();
        if (paramStr == null || paramStr.trim().isEmpty()) return result;
        for (String p : paramStr.split(",")) {
            String trimmed = p.trim();
            if (!trimmed.isEmpty()) result.add(trimmed);
        }
        return result;
    }

    /**
     * Returns the access modifier string, defaulting to "default" when absent.
     */
    private String resolveAccess(String group) {
        return (group != null && !group.isBlank()) ? group.trim() : "default";
    }

    // ── 4. Polymorphism Detection ──────────────────────────────────────

    /**
     * Finds method names that appear more than once (overloaded).
     */
    private void detectPolymorphism(ClassInfo info) {
        Map<String, Integer> nameCount = new LinkedHashMap<>();
        for (MethodInfo m : info.getMethods()) {
            nameCount.merge(m.getName(), 1, Integer::sum);
        }
        List<String> poly = new ArrayList<>();
        nameCount.forEach((name, count) -> {
            if (count > 1) poly.add(name + " (overloaded)");
        });
        info.setPolymorphism(poly);
    }

    // ── 5. Encapsulation Detection ─────────────────────────────────────

    /**
     * Scans body text for access modifier keywords and records which
     * ones are used (e.g., ["private", "public"]).
     */
    private void detectEncapsulation(String body, ClassInfo info) {
        Set<String> found = new LinkedHashSet<>();
        if (body.contains("private"))   found.add("private");
        if (body.contains("protected")) found.add("protected");
        if (body.contains("public"))    found.add("public");
        info.setEncapsulation(new ArrayList<>(found));
    }

    // ── 6. Object Extraction ───────────────────────────────────────────

    /**
     * Finds all object instantiations: Type name = new ClassName(...)
     */
    private List<ObjectInfo> extractObjects(String code) {
        List<ObjectInfo> objects = new ArrayList<>();
        Matcher m = OBJECT_CREATION_PATTERN.matcher(code);
        while (m.find()) {
            objects.add(new ObjectInfo(m.group(2), m.group(3)));
        }
        return objects;
    }

    // ── 7. Concept Extraction ──────────────────────────────────────────

    /**
     * Extracts general OOP concepts visible at the top level:
     *   - all variable names + types
     *   - reference variables (non-primitive types)
     *   - method call chains (obj.method())
     *   - control flow locations (if, for, while, switch)
     */
    private ConceptInfo extractConcepts(String code) {
        ConceptInfo concepts = new ConceptInfo();

        Set<String> vars    = new LinkedHashSet<>();
        Set<String> refVars = new LinkedHashSet<>();
        Set<String> types   = new LinkedHashSet<>();

        Matcher varMatcher = VAR_DECL_PATTERN.matcher(code);
        while (varMatcher.find()) {
            String type = varMatcher.group(1);
            String name = varMatcher.group(2);
            if (KEYWORDS.contains(name) || KEYWORDS.contains(type)) continue;

            vars.add(name);
            types.add(type);
            if (!PRIMITIVES.contains(type)) refVars.add(name);
        }

        concepts.setVariables(new ArrayList<>(vars));
        concepts.setReferenceVariables(new ArrayList<>(refVars));
        concepts.setDataTypes(new ArrayList<>(types));

        // Method calls: obj.method()
        Set<String> calls = new LinkedHashSet<>();
        Matcher callMatcher = METHOD_CALL_PATTERN.matcher(code);
        while (callMatcher.find()) {
            calls.add(callMatcher.group(1) + "." + callMatcher.group(2) + "()");
        }
        concepts.setMethodCalls(new ArrayList<>(calls));

        // Control flow locations
        List<String> flow = new ArrayList<>();
        String[] lines = code.split("\n");
        for (int i = 0; i < lines.length; i++) {
            String t = lines[i].trim();
            int ln = i + 1;
            if (t.startsWith("if"))     flow.add("if-else at line " + ln);
            if (t.startsWith("for"))    flow.add("for loop at line " + ln);
            if (t.startsWith("while"))  flow.add("while loop at line " + ln);
            if (t.startsWith("switch")) flow.add("switch at line " + ln);
            if (t.startsWith("do"))     flow.add("do-while at line " + ln);
        }
        concepts.setControlFlow(flow);

        return concepts;
    }
}
