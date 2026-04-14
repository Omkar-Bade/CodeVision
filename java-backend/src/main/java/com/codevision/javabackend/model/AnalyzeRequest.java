package com.codevision.javabackend.model;

public class AnalyzeRequest {
    private String code;

    public AnalyzeRequest() {}
    public AnalyzeRequest(String code) { this.code = code; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
}
