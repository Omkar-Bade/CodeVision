package com.codevision.javabackend.model;

import java.util.ArrayList;
import java.util.List;

/**
 * Top-level response returned by POST /analyze-java.
 *
 * {
 *   "classes":  [ { name, fields, methods, constructors, inheritance, ... } ],
 *   "objects":  [ { name, class } ],
 *   "concepts": { variables, referenceVariables, methodCalls, dataTypes, controlFlow },
 *   "imports":  [ "java.util.Scanner", "java.util.ArrayList", ... ]
 * }
 */
public class AnalyzeResponse {

    private List<ClassInfo>  classes  = new ArrayList<>();
    private List<ObjectInfo> objects  = new ArrayList<>();
    private ConceptInfo      concepts = new ConceptInfo();
    private List<String>     imports  = new ArrayList<>();

    public AnalyzeResponse() {}

    public List<ClassInfo> getClasses()                { return classes; }
    public void setClasses(List<ClassInfo> classes)    { this.classes = classes; }

    public List<ObjectInfo> getObjects()               { return objects; }
    public void setObjects(List<ObjectInfo> objects)   { this.objects = objects; }

    public ConceptInfo getConcepts()                   { return concepts; }
    public void setConcepts(ConceptInfo concepts)      { this.concepts = concepts; }

    public List<String> getImports()                   { return imports; }
    public void setImports(List<String> imports)       { this.imports = imports; }
}
