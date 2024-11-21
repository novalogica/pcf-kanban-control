/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import {
    Modal,
    Dropdown,
    IDropdownOption,
    PrimaryButton,
    DefaultButton,
    Stack,
    Text,
} from '@fluentui/react';
import { useState, useContext } from "react";
import { ViewEntity } from "../../interfaces";
//import { BoardContext } from "../../context/board-context";



interface IProps {
    views: ViewEntity[],
    entities: any,
    fetchViews: (logicalName: string) => void,
    handleEntitySave: () => void,
    setActiveViewEntity: React.Dispatch<React.SetStateAction<ViewEntity | undefined>>
}

const ModalPop = ({ fetchViews, entities, views, handleEntitySave, setActiveViewEntity }: IProps) => {
    const [isModalOpen, setIsModalOpen] = useState(true);
    const [selectedEntity, setSelectedEntity] = useState<string | undefined>();
    const [selectedView, setSelectedView] = useState<string | undefined>();

    const handleEntityChange = ( event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption) => {
        setSelectedEntity(option?.key as string);
        fetchViews(option?.key as string ?? "")
    };

    const handleViewChange = (event: React.FormEvent<HTMLDivElement>,option?: IDropdownOption) => {
        const view = views.find((val) => val.key === option?.key)
        console.log(option);
        setActiveViewEntity(view)
        setSelectedView(option?.key as string);
    };

    const handleSave = () => {
        console.log('Selected Entity:', selectedEntity);
        console.log('Selected View:', selectedView);
        setIsModalOpen(false);
        handleEntitySave()
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        handleEntitySave()
    };

    return (
        <div>
        <Modal
            isOpen={isModalOpen}
            onDismiss={handleCancel}
            isBlocking={false}
            styles={{
            main: { width: 400, padding: 20 },
            }}
        >
            <Stack tokens={{ childrenGap: 15 }}>
            <Text variant="large">Select Entity and View</Text>

            <Dropdown
                label="Entity"
                placeholder="Select an entity"
                options={entities}
                onChange={handleEntityChange}
                selectedKey={selectedEntity}
            />

            <Dropdown
                label="View"
                placeholder="Select a view"
                options={views}
                onChange={handleViewChange}
                selectedKey={selectedView}
            />

            <Stack horizontal tokens={{ childrenGap: 10 }}>
                <PrimaryButton text="Save" onClick={handleSave} disabled={!selectedEntity || !selectedView} />
                <DefaultButton text="Cancel" onClick={handleCancel} />
            </Stack>
            </Stack>
        </Modal>
        </div>
    );
};

export default ModalPop;