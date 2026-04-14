package com.codevision.javabackend.model;

import java.util.ArrayList;
import java.util.List;

/**
 * Represents a constructor found inside a Java class.
 *
 * Example source:  public Person(String name, int age)
 * Resulting object:
 *   {
 *     "name":       "Person",
 *     "parameters": ["String name", "int age"],
 *     "access":     "public"
 *   }
 */
public class ConstructorInfo {

    private String       name;
    private List<String> parameters = new ArrayList<>();
    private String       access;   // "public" | "private" | "protected" | "default"

    public ConstructorInfo() {}

    public ConstructorInfo(String name, List<String> parameters, String access) {
        this.name       = name;
        this.parameters = parameters;
        this.access     = access;
    }

    public String getName()                          { return name; }
    public void setName(String name)                 { this.name = name; }

    public List<String> getParameters()              { return parameters; }
    public void setParameters(List<String> params)   { this.parameters = params; }

    public String getAccess()                        { return access; }
    public void setAccess(String access)             { this.access = access; }
}
