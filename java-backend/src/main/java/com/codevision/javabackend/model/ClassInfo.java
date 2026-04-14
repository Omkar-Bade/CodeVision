package com.codevision.javabackend.model;

import java.util.ArrayList;
import java.util.List;

/**
 * Holds all extracted information about a single Java class.
 *
 * Fields, methods, and constructors are now structured objects
 * (FieldInfo, MethodInfo, ConstructorInfo) instead of plain strings,
 * so the frontend receives access modifiers, types, and parameters separately.
 */
public class ClassInfo {

    private String name;
    private String inheritance;                         // extends ClassName
    private List<String>          interfaces    = new ArrayList<>();  // implements X, Y
    private List<FieldInfo>       fields        = new ArrayList<>();  // instance variables
    private List<MethodInfo>      methods       = new ArrayList<>();  // member methods
    private List<ConstructorInfo> constructors  = new ArrayList<>();  // constructors
    private List<String>          polymorphism  = new ArrayList<>();  // overloaded method names
    private List<String>          encapsulation = new ArrayList<>();  // access modifiers found

    public ClassInfo() {}

    // ── Getters & Setters ──────────────────────────────────────────────

    public String getName()                             { return name; }
    public void setName(String name)                    { this.name = name; }

    public String getInheritance()                      { return inheritance; }
    public void setInheritance(String inheritance)      { this.inheritance = inheritance; }

    public List<String> getInterfaces()                 { return interfaces; }
    public void setInterfaces(List<String> interfaces)  { this.interfaces = interfaces; }

    public List<FieldInfo> getFields()                  { return fields; }
    public void setFields(List<FieldInfo> fields)       { this.fields = fields; }

    public List<MethodInfo> getMethods()                { return methods; }
    public void setMethods(List<MethodInfo> methods)    { this.methods = methods; }

    public List<ConstructorInfo> getConstructors()                      { return constructors; }
    public void setConstructors(List<ConstructorInfo> constructors)     { this.constructors = constructors; }

    public List<String> getPolymorphism()               { return polymorphism; }
    public void setPolymorphism(List<String> polymorphism) { this.polymorphism = polymorphism; }

    public List<String> getEncapsulation()              { return encapsulation; }
    public void setEncapsulation(List<String> encapsulation) { this.encapsulation = encapsulation; }
}
