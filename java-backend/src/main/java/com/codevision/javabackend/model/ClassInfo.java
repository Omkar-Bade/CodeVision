package com.codevision.javabackend.model;

import java.util.ArrayList;
import java.util.List;

public class ClassInfo {
    private String name;
    private List<String> attributes = new ArrayList<>();
    private List<String> methods = new ArrayList<>();
    private List<String> constructors = new ArrayList<>();
    private String inheritance;
    private List<String> interfaces = new ArrayList<>();
    private List<String> polymorphism = new ArrayList<>();
    private List<String> encapsulation = new ArrayList<>();

    public ClassInfo() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public List<String> getAttributes() { return attributes; }
    public void setAttributes(List<String> attributes) { this.attributes = attributes; }

    public List<String> getMethods() { return methods; }
    public void setMethods(List<String> methods) { this.methods = methods; }

    public List<String> getConstructors() { return constructors; }
    public void setConstructors(List<String> constructors) { this.constructors = constructors; }

    public String getInheritance() { return inheritance; }
    public void setInheritance(String inheritance) { this.inheritance = inheritance; }

    public List<String> getInterfaces() { return interfaces; }
    public void setInterfaces(List<String> interfaces) { this.interfaces = interfaces; }

    public List<String> getPolymorphism() { return polymorphism; }
    public void setPolymorphism(List<String> polymorphism) { this.polymorphism = polymorphism; }

    public List<String> getEncapsulation() { return encapsulation; }
    public void setEncapsulation(List<String> encapsulation) { this.encapsulation = encapsulation; }
}
