package com.codevision.javabackend.model;

import java.util.ArrayList;
import java.util.List;

public class ConceptInfo {
    private List<String> variables = new ArrayList<>();
    private List<String> referenceVariables = new ArrayList<>();
    private List<String> methodCalls = new ArrayList<>();
    private List<String> dataTypes = new ArrayList<>();
    private List<String> controlFlow = new ArrayList<>();

    public ConceptInfo() {}

    public List<String> getVariables() { return variables; }
    public void setVariables(List<String> variables) { this.variables = variables; }

    public List<String> getReferenceVariables() { return referenceVariables; }
    public void setReferenceVariables(List<String> referenceVariables) { this.referenceVariables = referenceVariables; }

    public List<String> getMethodCalls() { return methodCalls; }
    public void setMethodCalls(List<String> methodCalls) { this.methodCalls = methodCalls; }

    public List<String> getDataTypes() { return dataTypes; }
    public void setDataTypes(List<String> dataTypes) { this.dataTypes = dataTypes; }

    public List<String> getControlFlow() { return controlFlow; }
    public void setControlFlow(List<String> controlFlow) { this.controlFlow = controlFlow; }
}
