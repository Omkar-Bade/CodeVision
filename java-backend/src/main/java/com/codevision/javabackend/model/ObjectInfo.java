package com.codevision.javabackend.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class ObjectInfo {
    private String name;

    @JsonProperty("class")
    private String className;

    public ObjectInfo() {}

    public ObjectInfo(String name, String className) {
        this.name = name;
        this.className = className;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getClassName() { return className; }
    public void setClassName(String className) { this.className = className; }
}
