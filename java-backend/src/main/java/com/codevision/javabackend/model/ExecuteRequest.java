package com.codevision.javabackend.model;

public class ExecuteRequest {
    private String code;

    public ExecuteRequest() {}
    public ExecuteRequest(String code) { this.code = code; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
}
