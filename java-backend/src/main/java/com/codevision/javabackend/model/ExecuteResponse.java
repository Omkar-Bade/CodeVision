package com.codevision.javabackend.model;

import java.util.ArrayList;
import java.util.List;

public class ExecuteResponse {
    private List<ExecutionStep> steps = new ArrayList<>();
    private String output;
    private String error;
    private int totalSteps;

    public ExecuteResponse() {}

    public ExecuteResponse(List<ExecutionStep> steps, String output, String error) {
        this.steps = steps;
        this.output = output;
        this.error = error;
        this.totalSteps = steps.size();
    }

    public List<ExecutionStep> getSteps() { return steps; }
    public void setSteps(List<ExecutionStep> steps) { this.steps = steps; }

    public String getOutput() { return output; }
    public void setOutput(String output) { this.output = output; }

    public String getError() { return error; }
    public void setError(String error) { this.error = error; }

    public int getTotalSteps() { return totalSteps; }
    public void setTotalSteps(int totalSteps) { this.totalSteps = totalSteps; }
}
