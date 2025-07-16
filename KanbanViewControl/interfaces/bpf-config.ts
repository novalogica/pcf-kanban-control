interface BusinnessProcessFlowUIData {
    BusinessProcessFlowEntities: BusinessProcessFlowEntities;

}

interface BusinessProcessFlowEntities {
    "$values": BusinessProcessFlowEntity[];
}

interface BusinessProcessFlowEntity {
    Relationships?: any;
    EntityDisplayName: string,
    EntityLogicalName: string,
    RelationshipName: string,
    ReferencingAttributeName: string,
    IsClosedLoop: boolean,
    Stage: Stage;
}

interface Stage {
    StageId: string,
    NextStageId: string,
    StageLogicalName: string,
    StageDisplayName: string,
    StageCategory: string,
    Steps: { "$values": Step[] },  
}

interface Step {
    Name: string,
    StepId: string,
    Enabled: boolean,
    Required: boolean,
    Label: string,
    StepControlId: string,
    StepType: string
}