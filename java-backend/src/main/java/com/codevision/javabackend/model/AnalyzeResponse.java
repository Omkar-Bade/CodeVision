package com.codevision.javabackend.model;

import java.util.ArrayList;
import java.util.List;

public class AnalyzeResponse {
    private List<ClassInfo> classes = new ArrayList<>();
    private List<ObjectInfo> objects = new ArrayList<>();
    private ConceptInfo concepts = new ConceptInfo();

    public AnalyzeResponse() {}

    public List<ClassInfo> getClasses() { return classes; }
    public void setClasses(List<ClassInfo> classes) { this.classes = classes; }

    public List<ObjectInfo> getObjects() { return objects; }
    public void setObjects(List<ObjectInfo> objects) { this.objects = objects; }

    public ConceptInfo getConcepts() { return concepts; }
    public void setConcepts(ConceptInfo concepts) { this.concepts = concepts; }
}
