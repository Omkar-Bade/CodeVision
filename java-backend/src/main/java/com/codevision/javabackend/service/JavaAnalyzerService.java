package com.codevision.javabackend.service;

import com.codevision.javabackend.model.*;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * JavaAnalyzerService — Parses raw Java source code using regex to extract
 * OOP concepts, functional constructs, control flow, and object/reference info.
 *
 * Design: All parsing is regex-based for simplicity. No AST framework is used.
 * The service scans the code for class declarations, extracts class bodies via
 * brace-matching, then regex-scans each body for fields, methods, and constructors.
 */
@Service
public class JavaAnalyzerService {

    // ── Regex patterns ─────────────────────────────────────────────────

    private static final Pattern CLASS_PATTERN = Pattern.compile(
        "(public\\s+|abstract\\s+|final\\s+)*class\\s+(\\w+)" +
        "(?:\\s+extends\\s+(\\w+))?" +
        "(?:\\s+implements\\s+([\\w,\\s]+))?" +
        "\\s*\\{"
    );

    private static final Pattern INTERFACE_PATTERN = Pattern.compile(
        "(public\\s+)?interface\\s+(\\w+)(?:\\s+extends\\s+([\\w,\\s]+))?\\s*\\{"
    );

    private static final Pattern FIELD_PATTERN = Pattern.compile(
        "^\\s*(public|private|protected)?\\s*(static\\s+)?(final\\s+)?([\\w<>\\[\\]]+)\\s+(\\w+)\\s*[;=]"
    );

    private static final Pattern METHOD_PATTERN = Pattern.compile(
        "^\\s*(public|private|protected)?\\s*(static\\s+)?(abstract\\s+)?" +
        "([\\w<>\\[\\]]+)\\s+(\\w+)\\s*\\(([^)]*)\\)\\s*[{;]"
    );

    private static final Pattern OBJECT_CREATION_PATTERN = Pattern.compile(
        "([\\w<>\\[\\]]+)\\s+(\\w+)\\s*=\\s*new\\s+(\\w+)\\s*\\(([^)]*)\\)"
    );

    private static final Pattern METHOD_CALL_PATTERN = Pattern.compile(
        "(\\w+)\\s*\\.\\s*(\\w+)\\s*\\(([^)]*)\\)"
    );

    private static final Pattern VAR_DECL_PATTERN = Pattern.compile(
        "(?:public|private|protected)?\\s*(?:static\\s+)?(?:final\\s+)?([\\w<>\\[\\]]+)\\s+(\\w+)\\s*[;=]"
    );

    private static final Set<String> PRIMITIVE_TYPES = Set.of(
        "int", "long", "short", "byte", "float", "double", "char", "boolean", "void"
    );

    private static final Set<String> CONTROL_KEYWORDS = Set.of(
        "if", "else", "for", "while", "do", "switch", "case", "break", "continue", "return"
    );

    // ── Public API ─────────────────────────────────────────────────────

    public AnalyzeResponse analyze(String code) {
        AnalyzeResponse response = new AnalyzeResponse();
        response.setClasses(extractClasses(code));
        response.setObjects(extractObjects(code));
        response.setConcepts(extractConcepts(code));
        return response;
    }

    // ── Class extraction ───────────────────────────────────────────────

    private List<ClassInfo> extractClasses(String code) {
        List<ClassInfo> classes = new ArrayList<>();
        Matcher matcher = CLASS_PATTERN.matcher(code);

        while (matcher.find()) {
            ClassInfo info = new ClassInfo();
            info.setName(matcher.group(2));

            // Inheritance
            if (matcher.group(3) != null) {
                info.setInheritance(matcher.group(3).trim());
            }

            // Interfaces
            if (matcher.group(4) != null) {
                Arrays.stream(matcher.group(4).split(","))
                      .map(String::trim)
                      .filter(s -> !s.isEmpty())
                      .forEach(info.getInterfaces()::add);
            }

            // Extract class body via brace matching
            String body = extractBody(code, matcher.end() - 1);

            // Parse members
            parseClassMembers(body, info);

            // Detect polymorphism (overloaded methods)
            detectPolymorphism(info);

            // Detect encapsulation keywords used
            detectEncapsulation(body, info);

            classes.add(info);
        }
        return classes;
    }

    /**
     * Starting at the opening brace, finds the matching closing brace
     * and returns everything between them.
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

    /**
     * Walks the class body line-by-line to find constructors, methods, and fields.
     */
    private void parseClassMembers(String body, ClassInfo info) {
        String className = info.getName();
        String[] lines = body.split("\n");

        // Track method names for polymorphism detection later
        for (String rawLine : lines) {
            String line = rawLine.trim();
            if (line.isEmpty() || line.startsWith("//") || line.startsWith("/*") || line.startsWith("*")) {
                continue;
            }

            // --- Constructor: ClassName(...) ---
            Pattern ctorPattern = Pattern.compile(
                "(public|private|protected)?\\s*" + Pattern.quote(className) + "\\s*\\(([^)]*)\\)"
            );
            Matcher ctorMatcher = ctorPattern.matcher(line);
            if (ctorMatcher.find()) {
                String params = formatParamTypes(ctorMatcher.group(2));
                info.getConstructors().add(className + "(" + params + ")");
                continue;
            }

            // --- Method: returnType name(...) { or ; ---
            Matcher methodMatcher = METHOD_PATTERN.matcher(line);
            if (methodMatcher.find()) {
                String name = methodMatcher.group(5);
                // Skip if name matches className (constructor caught above sometimes)
                if (name.equals(className)) continue;
                String params = formatParamTypes(methodMatcher.group(6));
                info.getMethods().add(name + "(" + params + ")");
                continue;
            }

            // --- Field ---
            Matcher fieldMatcher = FIELD_PATTERN.matcher(line);
            if (fieldMatcher.find()) {
                String access = fieldMatcher.group(1);
                String fieldName = fieldMatcher.group(5);
                // Skip common false positives
                if (CONTROL_KEYWORDS.contains(fieldName) || fieldName.equals("return")) continue;
                String modifier = (access != null) ? " (" + access + ")" : "";
                info.getAttributes().add(fieldName + modifier);
            }
        }
    }

    /**
     * Converts "String name, int age" → "String, int"
     */
    private String formatParamTypes(String params) {
        if (params == null || params.trim().isEmpty()) return "";
        return Arrays.stream(params.split(","))
                     .map(String::trim)
                     .filter(s -> !s.isEmpty())
                     .map(p -> p.split("\\s+")[0]) // take only the type
                     .collect(Collectors.joining(", "));
    }

    /**
     * Detects method overloading: multiple methods sharing the same name.
     */
    private void detectPolymorphism(ClassInfo info) {
        Map<String, Integer> nameCount = new HashMap<>();
        for (String method : info.getMethods()) {
            String name = method.substring(0, method.indexOf('('));
            nameCount.merge(name, 1, Integer::sum);
        }
        nameCount.forEach((name, count) -> {
            if (count > 1) {
                info.getPolymorphism().add(name + " overloaded");
            }
        });
    }

    /**
     * Scans body for access modifier keywords.
     */
    private void detectEncapsulation(String body, ClassInfo info) {
        Set<String> found = new LinkedHashSet<>();
        if (body.contains("private"))   found.add("private");
        if (body.contains("protected")) found.add("protected");
        if (body.contains("public"))    found.add("public");
        info.setEncapsulation(new ArrayList<>(found));
    }

    // ── Object extraction ──────────────────────────────────────────────

    private List<ObjectInfo> extractObjects(String code) {
        List<ObjectInfo> objects = new ArrayList<>();
        Matcher matcher = OBJECT_CREATION_PATTERN.matcher(code);
        while (matcher.find()) {
            String varName = matcher.group(2);
            String className = matcher.group(3);
            objects.add(new ObjectInfo(varName, className));
        }
        return objects;
    }

    // ── Concept extraction ─────────────────────────────────────────────

    private ConceptInfo extractConcepts(String code) {
        ConceptInfo concepts = new ConceptInfo();

        // Variables & data types
        Set<String> vars = new LinkedHashSet<>();
        Set<String> refVars = new LinkedHashSet<>();
        Set<String> types = new LinkedHashSet<>();

        Matcher varMatcher = VAR_DECL_PATTERN.matcher(code);
        while (varMatcher.find()) {
            String type = varMatcher.group(1);
            String name = varMatcher.group(2);
            // Skip keywords that look like declarations
            if (CONTROL_KEYWORDS.contains(name) || "class".equals(name)) continue;

            vars.add(name);
            types.add(type);

            // Reference variable = non-primitive type
            if (!PRIMITIVE_TYPES.contains(type)) {
                refVars.add(name);
            }
        }
        concepts.setVariables(new ArrayList<>(vars));
        concepts.setReferenceVariables(new ArrayList<>(refVars));
        concepts.setDataTypes(new ArrayList<>(types));

        // Method calls
        Set<String> calls = new LinkedHashSet<>();
        Matcher callMatcher = METHOD_CALL_PATTERN.matcher(code);
        while (callMatcher.find()) {
            String obj = callMatcher.group(1);
            String method = callMatcher.group(2);
            calls.add(obj + "." + method + "()");
        }
        concepts.setMethodCalls(new ArrayList<>(calls));

        // Control flow
        List<String> flow = new ArrayList<>();
        String[] lines = code.split("\n");
        for (int i = 0; i < lines.length; i++) {
            String trimmed = lines[i].trim();
            int lineNum = i + 1;
            if (trimmed.startsWith("if"))     flow.add("if-else block at line " + lineNum);
            if (trimmed.startsWith("for"))    flow.add("for loop at line " + lineNum);
            if (trimmed.startsWith("while"))  flow.add("while loop at line " + lineNum);
            if (trimmed.startsWith("switch")) flow.add("switch statement at line " + lineNum);
        }
        concepts.setControlFlow(flow);

        return concepts;
    }
}
