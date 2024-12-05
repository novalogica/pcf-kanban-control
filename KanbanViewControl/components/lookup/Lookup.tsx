import * as React from "react";
import { useMemo } from "react";
import { getInitials } from "@fluentui/react/lib/Utilities";
import { IPersonaProps, Persona, PersonaInitialsColor } from "@fluentui/react/lib/Persona";
import { Text } from "@fluentui/react/lib/Text";
import { CardInfo } from "../../interfaces";
import { getColorFromInitials } from "../../lib/utils";

interface IProps {
  info: CardInfo
  onOpenLookup: (entityName: string, id: string) => void
}

const colors = [
  PersonaInitialsColor.lightBlue,
  PersonaInitialsColor.blue,
  PersonaInitialsColor.teal,
  PersonaInitialsColor.lightGreen,
  PersonaInitialsColor.green,
  PersonaInitialsColor.lightPink,
  PersonaInitialsColor.magenta,
  PersonaInitialsColor.purple,
  PersonaInitialsColor.orange,
  PersonaInitialsColor.violet,
  PersonaInitialsColor.lightRed,
  PersonaInitialsColor.gold,
  PersonaInitialsColor.burgundy,
  PersonaInitialsColor.warmGray,
  PersonaInitialsColor.coolGray,
  PersonaInitialsColor.cyan,
]

const personaContainer: React.CSSProperties = {
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'start', 
    fontSize: '12px', 
    color: '#115ea3',
    cursor: 'pointer',
    gap: 4,
}

export const Lookup = ({ onOpenLookup, info }: IProps) => {
  const { etn, id, name } = info.value as ComponentFramework.EntityReference

  const initials = useMemo(() => getInitials(name, false), [name])

  const onPersonaClicked = () => {
    etn && onOpenLookup(etn, id.guid)
  }

  return (
    <div style={personaContainer} className="personaContainer" onClick={onPersonaClicked}>
        <Persona
          className="user-badge"
          text={name}
          coinSize={22}
          imageInitials={initials}
          initialsColor={getColorFromInitials(initials, colors)}
          onRenderPrimaryText={(props?: IPersonaProps) => (
            <Text className="lookup-persona-name" variant="medium" nowrap>
              {props?.text}
            </Text>
          )}
        />
    </div>
  );
};