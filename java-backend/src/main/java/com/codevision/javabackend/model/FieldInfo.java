package com.codevision.javabackend.model;

/**
 * Represents a single field (instance variable) found inside a Java class.
 *
 * Example source:  private String name;
 * Resulting object:
 *   { "name": "name", "type": "String", "access": "private" }
 */
public class FieldInfo {

    private String name;
    private String type;
    private String access;   // "public" | "private" | "protected" | "default"

    public FieldInfo() {}

    public FieldInfo(String name, String type, String access) {
        this.name   = name;
        this.type   = type;
        this.access = access;
    }

    public String getName()   { return name; }
    public void setName(String name) { this.name = name; }

    public String getType()   { return type; }
    public void setType(String type) { this.type = type; }

    public String getAccess() { return access; }
    public void setAccess(String access) { this.access = access; }
}
