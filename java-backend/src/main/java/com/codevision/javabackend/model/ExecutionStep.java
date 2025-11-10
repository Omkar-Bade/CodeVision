package com.codevision.javabackend.model;

import java.util.LinkedHashMap;
import java.util.Map;

public class ExecutionStep {
    private int step;
    private int line;
    private String code;
    private Map<String, Object> variables = new LinkedHashMap<>();
    private String output;
    private String event;

    public ExecutionStep() {}

    public ExecutionStep(int step, int line, String code,
                         Map<String, Object> variables, String output, String event) {
        this.step = step;
        this.line = line;
        this.code = code;
        this.variables = variables;
        this.output = output;
        this.event = event;
    }

    public int getStep() { return step; }
    public void setStep(int step) { this.step = step; }

    public int getLine() { return line; }
    public void setLine(int line) { this.line = line; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public Map<String, Object> getVariables() { return variables; }
    public void setVariables(Map<String, Object> variables) { this.variables = variables; }

    public String getOutput() { return output; }
    public void setOutput(String output) { this.output = output; }

    public String getEvent() { return event; }
    public void setEvent(String event) { this.event = event; }
}
