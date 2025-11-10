package com.codevision.javabackend.service;

import com.codevision.javabackend.model.ExecuteResponse;
import com.codevision.javabackend.model.ExecutionStep;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * JavaExecutorService — A lightweight interpreter for simplified Java code.
 *
 * Supports: variable declarations (primitives + references), arithmetic,
 * assignments, if-else, for loops, while loops, System.out.println,
 * basic object creation, and increment/decrement operators.
 *
 * Architecture:
 *   1. Code is split into lines and parsed into Statement objects.
 *      Block statements (if/for/while) collect their body by brace-matching.
 *   2. Statements are executed sequentially against a variable context.
 *   3. After each variable-mutating line, a snapshot (ExecutionStep) is recorded.
 *
 * The expression evaluator uses recursive-descent parsing with standard
 * operator precedence (||, &&, ==, comparisons, +/-, * / %).
 */
@Service
public class JavaExecutorService {

    private static final int MAX_STEPS = 500;

    // ── Statement representation ───────────────────────────────────────

    private enum StmtType {
        DECLARATION, ASSIGNMENT, IF, FOR, WHILE, PRINT, EXPRESSION, COMPOUND_ASSIGN, INCREMENT
    }

    private static class Stmt {
        StmtType type;
        int lineNumber;
        String raw;

        // DECLARATION / ASSIGNMENT
        String varType;
        String varName;
        String expression;

        // IF
        String condition;
        List<Stmt> thenBlock;
        List<Stmt> elseBlock;

        // FOR
        Stmt forInit;
        String forCondition;
        Stmt forUpdate;
        List<Stmt> forBody;

        // WHILE
        String whileCondition;
        List<Stmt> whileBody;

        // PRINT
        String printExpr;

        // COMPOUND_ASSIGN (+=, -=, etc.)
        String compoundOp;

        // INCREMENT (i++, ++i, i--, --i)
        String incrVar;
        int incrDelta; // +1 or -1
    }

    // ── Execution context ──────────────────────────────────────────────

    private static class Context {
        Map<String, Object> variables = new LinkedHashMap<>();
        List<ExecutionStep> steps = new ArrayList<>();
        StringBuilder output = new StringBuilder();
        int stepCount = 0;
    }

    // ── Public API ─────────────────────────────────────────────────────

    public ExecuteResponse execute(String code) {
        Context ctx = new Context();
        try {
            String[] rawLines = code.split("\n");
            List<Stmt> statements = parseStatements(rawLines, 0, rawLines.length, 0);
            executeBlock(statements, ctx);
        } catch (Exception e) {
            String output = ctx.output.toString();
            return new ExecuteResponse(ctx.steps, output, e.getMessage());
        }
        return new ExecuteResponse(ctx.steps, ctx.output.toString(), null);
    }

    // ════════════════════════════════════════════════════════════════════
    //  PARSER — converts lines into Stmt objects
    // ════════════════════════════════════════════════════════════════════

    /**
     * Parses lines[start..end) into a flat list of statements.
     * lineOffset is added to produce 1-based line numbers.
     */
    private List<Stmt> parseStatements(String[] lines, int start, int end, int lineOffset) {
        List<Stmt> stmts = new ArrayList<>();
        int i = start;

        while (i < end) {
            String line = lines[i].trim();
            if (line.isEmpty() || line.equals("{") || line.equals("}") ||
                line.startsWith("//") || line.startsWith("/*") || line.startsWith("*")) {
                i++;
                continue;
            }

            int lineNum = i + 1 + lineOffset;

            // ── if ───────────────────────────────────────────────────
            if (line.startsWith("if")) {
                Stmt s = new Stmt();
                s.type = StmtType.IF;
                s.lineNumber = lineNum;
                s.raw = line;
                s.condition = extractParenContent(line);

                int bodyStart = findOpenBrace(lines, i);
                int bodyEnd = findClosingBrace(lines, bodyStart);
                s.thenBlock = parseStatements(lines, bodyStart + 1, bodyEnd, lineOffset);

                // Check for else
                int afterClose = bodyEnd + 1;
                if (afterClose < end && lines[afterClose].trim().startsWith("else")) {
                    String elseLine = lines[afterClose].trim();
                    if (elseLine.contains("if")) {
                        // else if → parse recursively as a single-element else block
                        int elseBodyEnd = findClosingBrace(lines, findOpenBrace(lines, afterClose));
                        s.elseBlock = parseStatements(lines, afterClose, elseBodyEnd + 1, lineOffset);
                        i = elseBodyEnd + 1;
                    } else {
                        int elseBodyStart = findOpenBrace(lines, afterClose);
                        int elseBodyEnd = findClosingBrace(lines, elseBodyStart);
                        s.elseBlock = parseStatements(lines, elseBodyStart + 1, elseBodyEnd, lineOffset);
                        i = elseBodyEnd + 1;
                    }
                } else {
                    i = bodyEnd + 1;
                }
                stmts.add(s);
                continue;
            }

            // ── for ──────────────────────────────────────────────────
            if (line.startsWith("for")) {
                Stmt s = new Stmt();
                s.type = StmtType.FOR;
                s.lineNumber = lineNum;
                s.raw = line;

                String paren = extractParenContent(line);
                String[] parts = paren.split(";");
                if (parts.length == 3) {
                    s.forInit = parseSimple(parts[0].trim(), lineNum);
                    s.forCondition = parts[1].trim();
                    s.forUpdate = parseSimple(parts[2].trim(), lineNum);
                }

                int bodyStart = findOpenBrace(lines, i);
                int bodyEnd = findClosingBrace(lines, bodyStart);
                s.forBody = parseStatements(lines, bodyStart + 1, bodyEnd, lineOffset);
                stmts.add(s);
                i = bodyEnd + 1;
                continue;
            }

            // ── while ────────────────────────────────────────────────
            if (line.startsWith("while")) {
                Stmt s = new Stmt();
                s.type = StmtType.WHILE;
                s.lineNumber = lineNum;
                s.raw = line;
                s.whileCondition = extractParenContent(line);

                int bodyStart = findOpenBrace(lines, i);
                int bodyEnd = findClosingBrace(lines, bodyStart);
                s.whileBody = parseStatements(lines, bodyStart + 1, bodyEnd, lineOffset);
                stmts.add(s);
                i = bodyEnd + 1;
                continue;
            }

            // ── simple statements ────────────────────────────────────
            Stmt s = parseSimple(line.replaceAll(";$", "").trim(), lineNum);
            if (s != null) stmts.add(s);
            i++;
        }
        return stmts;
    }

    /**
     * Parses a single non-block line into a Stmt.
     */
    private Stmt parseSimple(String line, int lineNum) {
        if (line == null || line.isEmpty()) return null;

        Stmt s = new Stmt();
        s.lineNumber = lineNum;
        s.raw = line;

        // System.out.println / System.out.print
        if (line.startsWith("System.out.print")) {
            s.type = StmtType.PRINT;
            Matcher m = Pattern.compile("System\\.out\\.printl?n?\\s*\\((.*)\\)").matcher(line);
            s.printExpr = m.find() ? m.group(1) : "";
            return s;
        }

        // Increment / Decrement: i++, ++i, i--, --i
        Matcher incr = Pattern.compile("^(\\w+)\\+\\+$").matcher(line);
        if (incr.matches()) {
            s.type = StmtType.INCREMENT;
            s.incrVar = incr.group(1);
            s.incrDelta = 1;
            return s;
        }
        incr = Pattern.compile("^\\+\\+(\\w+)$").matcher(line);
        if (incr.matches()) {
            s.type = StmtType.INCREMENT;
            s.incrVar = incr.group(1);
            s.incrDelta = 1;
            return s;
        }
        incr = Pattern.compile("^(\\w+)--$").matcher(line);
        if (incr.matches()) {
            s.type = StmtType.INCREMENT;
            s.incrVar = incr.group(1);
            s.incrDelta = -1;
            return s;
        }
        incr = Pattern.compile("^--(\\w+)$").matcher(line);
        if (incr.matches()) {
            s.type = StmtType.INCREMENT;
            s.incrVar = incr.group(1);
            s.incrDelta = -1;
            return s;
        }

        // Compound assignment: +=, -=, *=, /=, %=
        Matcher compound = Pattern.compile("^(\\w+)\\s*(\\+=|-=|\\*=|/=|%=)\\s*(.+)$").matcher(line);
        if (compound.matches()) {
            s.type = StmtType.COMPOUND_ASSIGN;
            s.varName = compound.group(1);
            s.compoundOp = compound.group(2);
            s.expression = compound.group(3).trim();
            return s;
        }

        // Variable declaration: type name = expr  OR  type name
        Matcher decl = Pattern.compile(
            "^(int|long|short|byte|float|double|char|boolean|String|\\w+)\\s+(\\w+)\\s*(?:=\\s*(.+))?$"
        ).matcher(line);
        if (decl.matches()) {
            s.type = StmtType.DECLARATION;
            s.varType = decl.group(1);
            s.varName = decl.group(2);
            s.expression = decl.group(3); // may be null
            return s;
        }

        // Assignment: name = expr
        Matcher assign = Pattern.compile("^(\\w+)\\s*=\\s*(.+)$").matcher(line);
        if (assign.matches()) {
            s.type = StmtType.ASSIGNMENT;
            s.varName = assign.group(1);
            s.expression = assign.group(2).trim();
            return s;
        }

        // Fallback: expression statement (e.g. method call)
        s.type = StmtType.EXPRESSION;
        s.expression = line;
        return s;
    }

    // ── Block helpers ──────────────────────────────────────────────────

    private String extractParenContent(String line) {
        int open = line.indexOf('(');
        if (open == -1) return "";
        int depth = 0;
        for (int i = open; i < line.length(); i++) {
            if (line.charAt(i) == '(') depth++;
            if (line.charAt(i) == ')') {
                depth--;
                if (depth == 0) return line.substring(open + 1, i);
            }
        }
        return line.substring(open + 1);
    }

    private int findOpenBrace(String[] lines, int from) {
        for (int i = from; i < lines.length; i++) {
            if (lines[i].contains("{")) return i;
        }
        return from;
    }

    private int findClosingBrace(String[] lines, int openLine) {
        int depth = 0;
        for (int i = openLine; i < lines.length; i++) {
            for (char c : lines[i].toCharArray()) {
                if (c == '{') depth++;
                if (c == '}') {
                    depth--;
                    if (depth == 0) return i;
                }
            }
        }
        return lines.length - 1;
    }

    // ════════════════════════════════════════════════════════════════════
    //  EXECUTOR — walks statements, mutates context, records steps
    // ════════════════════════════════════════════════════════════════════

    private void executeBlock(List<Stmt> stmts, Context ctx) {
        for (Stmt s : stmts) {
            if (ctx.stepCount >= MAX_STEPS) {
                throw new RuntimeException("Execution exceeded " + MAX_STEPS +
                    " steps. Possible infinite loop.");
            }
            executeStmt(s, ctx);
        }
    }

    private void executeStmt(Stmt s, Context ctx) {
        switch (s.type) {
            case DECLARATION -> {
                Object value = null;
                if (s.expression != null) {
                    value = evaluate(s.expression.trim(), ctx.variables);
                } else {
                    value = defaultValue(s.varType);
                }
                value = coerceToType(value, s.varType);
                ctx.variables.put(s.varName, value);
                recordStep(ctx, s.lineNumber, s.raw);
            }
            case ASSIGNMENT -> {
                Object value = evaluate(s.expression, ctx.variables);
                ctx.variables.put(s.varName, value);
                recordStep(ctx, s.lineNumber, s.raw);
            }
            case COMPOUND_ASSIGN -> {
                Object current = ctx.variables.getOrDefault(s.varName, 0);
                Object rhs = evaluate(s.expression, ctx.variables);
                Object result = applyCompound(current, s.compoundOp, rhs);
                ctx.variables.put(s.varName, result);
                recordStep(ctx, s.lineNumber, s.raw);
            }
            case INCREMENT -> {
                Object current = ctx.variables.getOrDefault(s.incrVar, 0);
                if (current instanceof Integer) {
                    ctx.variables.put(s.incrVar, (Integer) current + s.incrDelta);
                } else if (current instanceof Double) {
                    ctx.variables.put(s.incrVar, (Double) current + s.incrDelta);
                }
                recordStep(ctx, s.lineNumber, s.raw);
            }
            case IF -> {
                Object cond = evaluate(s.condition, ctx.variables);
                if (toBool(cond)) {
                    executeBlock(s.thenBlock, ctx);
                } else if (s.elseBlock != null) {
                    executeBlock(s.elseBlock, ctx);
                }
            }
            case FOR -> {
                if (s.forInit != null) executeStmt(s.forInit, ctx);
                int loopGuard = 0;
                while (toBool(evaluate(s.forCondition, ctx.variables))) {
                    if (++loopGuard > MAX_STEPS) {
                        throw new RuntimeException("For-loop exceeded max iterations.");
                    }
                    executeBlock(s.forBody, ctx);
                    if (s.forUpdate != null) executeStmt(s.forUpdate, ctx);
                }
            }
            case WHILE -> {
                int loopGuard = 0;
                while (toBool(evaluate(s.whileCondition, ctx.variables))) {
                    if (++loopGuard > MAX_STEPS) {
                        throw new RuntimeException("While-loop exceeded max iterations.");
                    }
                    executeBlock(s.whileBody, ctx);
                }
            }
            case PRINT -> {
                Object val = evaluate(s.printExpr, ctx.variables);
                String text = (val == null) ? "null" : val.toString();
                ctx.output.append(text).append("\n");
                recordStep(ctx, s.lineNumber, s.raw);
            }
            case EXPRESSION -> {
                // no-op for now (method calls, etc.)
            }
        }
    }

    private void recordStep(Context ctx, int line, String code) {
        ctx.stepCount++;
        ctx.steps.add(new ExecutionStep(
            ctx.stepCount,
            line,
            code,
            new LinkedHashMap<>(ctx.variables),
            ctx.output.length() > 0 ? ctx.output.toString() : null,
            "line"
        ));
    }

    private Object defaultValue(String type) {
        return switch (type) {
            case "int", "long", "short", "byte" -> 0;
            case "float", "double" -> 0.0;
            case "boolean" -> false;
            case "char" -> '\0';
            case "String" -> "";
            default -> null;
        };
    }

    /**
     * Coerce a value to match a declared Java type.
     * Ensures expressions like "a + 2" produce Integer when declared as int.
     */
    private Object coerceToType(Object value, String type) {
        if (type == null || value == null) return value;
        return switch (type) {
            case "int"     -> (value instanceof Number) ? ((Number) value).intValue() : value;
            case "long"    -> (value instanceof Number) ? ((Number) value).longValue() : value;
            case "short"   -> (value instanceof Number) ? ((Number) value).shortValue() : value;
            case "byte"    -> (value instanceof Number) ? ((Number) value).byteValue() : value;
            case "float"   -> (value instanceof Number) ? ((Number) value).floatValue() : value;
            case "double"  -> (value instanceof Number) ? ((Number) value).doubleValue() : value;
            case "boolean" -> (value instanceof Boolean) ? value : toBool(value);
            case "String"  -> value.toString();
            default -> value;
        };
    }

    private Object applyCompound(Object left, String op, Object right) {
        double l = toNumber(left);
        double r = toNumber(right);
        double result = switch (op) {
            case "+=" -> l + r;
            case "-=" -> l - r;
            case "*=" -> l * r;
            case "/=" -> r != 0 ? l / r : 0;
            case "%=" -> r != 0 ? l % r : 0;
            default -> l;
        };
        if (left instanceof Integer && right instanceof Integer) return (int) result;
        return result;
    }

    // ════════════════════════════════════════════════════════════════════
    //  EXPRESSION EVALUATOR — recursive descent with standard precedence
    //
    //  Precedence (low → high):
    //    ||  →  &&  →  == !=  →  < > <= >=  →  + -  →  * / %  →  unary  →  primary
    // ════════════════════════════════════════════════════════════════════

    /**
     * Thread-safe wrapper: each evaluate() call creates its own cursor array.
     * cursor[0] is the current position in the token list.
     */
    private Object evaluate(String expr, Map<String, Object> vars) {
        List<String> tokens = tokenize(expr);
        int[] cursor = {0};
        return parseOr(vars, tokens, cursor);
    }

    private Object parseOr(Map<String, Object> vars, List<String> tokens, int[] cursor) {
        Object left = parseAnd(vars, tokens, cursor);
        while (cursor[0] < tokens.size() && tokens.get(cursor[0]).equals("||")) {
            cursor[0]++;
            Object right = parseAnd(vars, tokens, cursor);
            left = toBool(left) || toBool(right);
        }
        return left;
    }

    private Object parseAnd(Map<String, Object> vars, List<String> tokens, int[] cursor) {
        Object left = parseEquality(vars, tokens, cursor);
        while (cursor[0] < tokens.size() && tokens.get(cursor[0]).equals("&&")) {
            cursor[0]++;
            Object right = parseEquality(vars, tokens, cursor);
            left = toBool(left) && toBool(right);
        }
        return left;
    }

    private Object parseEquality(Map<String, Object> vars, List<String> tokens, int[] cursor) {
        Object left = parseComparison(vars, tokens, cursor);
        while (cursor[0] < tokens.size()) {
            String t = tokens.get(cursor[0]);
            if (t.equals("==") || t.equals("!=")) {
                cursor[0]++;
                Object right = parseComparison(vars, tokens, cursor);
                if (t.equals("==")) left = Objects.equals(left, right);
                else                left = !Objects.equals(left, right);
            } else break;
        }
        return left;
    }

    private Object parseComparison(Map<String, Object> vars, List<String> tokens, int[] cursor) {
        Object left = parseAddSub(vars, tokens, cursor);
        while (cursor[0] < tokens.size()) {
            String t = tokens.get(cursor[0]);
            if (t.equals("<") || t.equals(">") || t.equals("<=") || t.equals(">=")) {
                cursor[0]++;
                Object right = parseAddSub(vars, tokens, cursor);
                double l = toNumber(left), r = toNumber(right);
                left = switch (t) {
                    case "<"  -> l < r;
                    case ">"  -> l > r;
                    case "<=" -> l <= r;
                    case ">=" -> l >= r;
                    default -> false;
                };
            } else break;
        }
        return left;
    }

    private Object parseAddSub(Map<String, Object> vars, List<String> tokens, int[] cursor) {
        Object left = parseMulDiv(vars, tokens, cursor);
        while (cursor[0] < tokens.size()) {
            String t = tokens.get(cursor[0]);
            if (t.equals("+") || t.equals("-")) {
                cursor[0]++;
                Object right = parseMulDiv(vars, tokens, cursor);
                if (t.equals("+")) {
                    // String concatenation support
                    if (left instanceof String || right instanceof String) {
                        left = String.valueOf(left) + String.valueOf(right);
                    } else {
                        double res = toNumber(left) + toNumber(right);
                        left = isInt(left) && isInt(right) ? (int) res : res;
                    }
                } else {
                    double res = toNumber(left) - toNumber(right);
                    left = isInt(left) && isInt(right) ? (int) res : res;
                }
            } else break;
        }
        return left;
    }

    private Object parseMulDiv(Map<String, Object> vars, List<String> tokens, int[] cursor) {
        Object left = parseUnary(vars, tokens, cursor);
        while (cursor[0] < tokens.size()) {
            String t = tokens.get(cursor[0]);
            if (t.equals("*") || t.equals("/") || t.equals("%")) {
                cursor[0]++;
                Object right = parseUnary(vars, tokens, cursor);
                double l = toNumber(left), r = toNumber(right);
                double res = switch (t) {
                    case "*" -> l * r;
                    case "/" -> r != 0 ? l / r : 0;
                    case "%" -> r != 0 ? l % r : 0;
                    default -> 0;
                };
                left = isInt(left) && isInt(right) ? (int) res : res;
            } else break;
        }
        return left;
    }

    private Object parseUnary(Map<String, Object> vars, List<String> tokens, int[] cursor) {
        if (cursor[0] < tokens.size()) {
            String t = tokens.get(cursor[0]);
            if (t.equals("!")) {
                cursor[0]++;
                return !toBool(parseUnary(vars, tokens, cursor));
            }
            if (t.equals("-")) {
                cursor[0]++;
                Object val = parseUnary(vars, tokens, cursor);
                double d = toNumber(val);
                return isInt(val) ? (int) (-d) : -d;
            }
        }
        return parsePrimary(vars, tokens, cursor);
    }

    private Object parsePrimary(Map<String, Object> vars, List<String> tokens, int[] cursor) {
        if (cursor[0] >= tokens.size()) return null;

        String t = tokens.get(cursor[0]);

        // Parenthesized expression
        if (t.equals("(")) {
            cursor[0]++;
            Object val = parseOr(vars, tokens, cursor);
            if (cursor[0] < tokens.size() && tokens.get(cursor[0]).equals(")")) cursor[0]++;
            return val;
        }

        // String literal
        if (t.startsWith("\"") && t.endsWith("\"") && t.length() >= 2) {
            cursor[0]++;
            return t.substring(1, t.length() - 1);
        }

        // Boolean
        if (t.equals("true"))  { cursor[0]++; return true; }
        if (t.equals("false")) { cursor[0]++; return false; }
        if (t.equals("null"))  { cursor[0]++; return null; }

        // new ClassName(args) → store a descriptive string
        if (t.equals("new") && cursor[0] + 1 < tokens.size()) {
            cursor[0]++;
            String className = tokens.get(cursor[0]++);
            StringBuilder repr = new StringBuilder("new " + className + "(");
            if (cursor[0] < tokens.size() && tokens.get(cursor[0]).equals("(")) {
                cursor[0]++; // skip (
                int depth = 1;
                while (cursor[0] < tokens.size() && depth > 0) {
                    String tk = tokens.get(cursor[0]++);
                    if (tk.equals("(")) depth++;
                    if (tk.equals(")")) { depth--; if (depth == 0) break; }
                    repr.append(tk);
                }
            }
            repr.append(")");
            return repr.toString();
        }

        // Number (integer or double) — try BEFORE advancing cursor
        if (t.matches("-?\\d+\\.\\d+")) {
            cursor[0]++;
            return Double.parseDouble(t);
        }
        if (t.matches("-?\\d+")) {
            cursor[0]++;
            return Integer.parseInt(t);
        }

        // Variable reference
        if (vars.containsKey(t)) {
            cursor[0]++;
            return vars.get(t);
        }

        // Unknown identifier — return as string representation
        cursor[0]++;
        return t;
    }

    // ── Tokenizer ──────────────────────────────────────────────────────

    private List<String> tokenize(String expr) {
        List<String> toks = new ArrayList<>();
        int i = 0;
        while (i < expr.length()) {
            char c = expr.charAt(i);
            if (Character.isWhitespace(c)) { i++; continue; }

            // Two-char operators
            if (i + 1 < expr.length()) {
                String two = expr.substring(i, i + 2);
                if (two.equals("==") || two.equals("!=") || two.equals("<=") ||
                    two.equals(">=") || two.equals("&&") || two.equals("||") ||
                    two.equals("+=") || two.equals("-=") || two.equals("*=") ||
                    two.equals("/=") || two.equals("%=")) {
                    toks.add(two);
                    i += 2;
                    continue;
                }
            }

            // Single-char operators and parens
            if ("+-*/%<>=!(),".indexOf(c) != -1) {
                toks.add(String.valueOf(c));
                i++;
                continue;
            }

            // String literal
            if (c == '"') {
                int end = expr.indexOf('"', i + 1);
                if (end == -1) end = expr.length() - 1;
                toks.add(expr.substring(i, end + 1));
                i = end + 1;
                continue;
            }

            // Number
            if (Character.isDigit(c) || (c == '.' && i + 1 < expr.length() && Character.isDigit(expr.charAt(i+1)))) {
                int start = i;
                while (i < expr.length() && (Character.isDigit(expr.charAt(i)) || expr.charAt(i) == '.')) i++;
                toks.add(expr.substring(start, i));
                continue;
            }

            // Identifier / keyword
            if (Character.isJavaIdentifierStart(c)) {
                int start = i;
                while (i < expr.length() && Character.isJavaIdentifierPart(expr.charAt(i))) i++;
                toks.add(expr.substring(start, i));
                continue;
            }

            i++; // skip unknown char
        }
        return toks;
    }

    // ── Type helpers ───────────────────────────────────────────────────

    private double toNumber(Object val) {
        if (val instanceof Integer)    return (Integer) val;
        if (val instanceof Double)     return (Double) val;
        if (val instanceof Long)       return (Long) val;
        if (val instanceof Boolean)    return ((Boolean) val) ? 1 : 0;
        if (val instanceof String) {
            try { return Double.parseDouble((String) val); } catch (Exception e) { return 0; }
        }
        return 0;
    }

    private boolean toBool(Object val) {
        if (val instanceof Boolean) return (Boolean) val;
        if (val instanceof Integer) return (Integer) val != 0;
        if (val instanceof Double)  return (Double) val != 0;
        if (val instanceof String)  return !((String) val).isEmpty();
        return val != null;
    }

    private boolean isInt(Object val) {
        return val instanceof Integer;
    }
}
