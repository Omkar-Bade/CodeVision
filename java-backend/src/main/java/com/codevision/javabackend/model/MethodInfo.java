package com.codevision.javabackend.model;

import java.util.ArrayList;
import java.util.List;

/**
 * Represents a single method found inside a Java class.
 *
 * Example source:  public void display(int a, String b)
 * Resulting object:
 *   {
 *     "name":       "display",
 *     "returnType": "void",
 *     "parameters": ["int a", "String b"],
 *     "access":     "public"
 *   }
 */
public class MethodInfo {

    private String       name;
    private String       returnType;
    private List<String> parameters = new ArrayList<>();
    private String       access;   // "public" | "private" | "protected" | "default"

    public MethodInfo() {}

    public MethodInfo(String name, String returnType, List<String> parameters, String access) {
        this.name       = name;
        this.returnType = returnType;
        this.parameters = parameters;
        this.access     = access;
    }

    public String getName()             { return name; }
    public void setName(String name)    { this.name = name; }

    public String getReturnType()              { return returnType; }
    public void setReturnType(String returnType) { this.returnType = returnType; }

    public List<String> getParameters()                   { return parameters; }
    public void setParameters(List<String> parameters)    { this.parameters = parameters; }

    public String getAccess()              { return access; }
    public void setAccess(String access)   { this.access = access; }
}
