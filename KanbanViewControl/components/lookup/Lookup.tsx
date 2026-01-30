import * as React from "react";
import { useMemo } from "react";
import { getInitials } from "@fluentui/react/lib/Utilities";
import { IPersonaProps, Persona, PersonaInitialsColor } from "@fluentui/react/lib/Persona";
import { Text } from "@fluentui/react/lib/Text";
import { CardInfo } from "../../interfaces";
import { getColorFromInitials } from "../../lib/utils";

interface IProps {
  info: CardInfo;
  onOpenLookup: (entityName: string, id: string) => void;
  /** When true, render as Persona (image/initials); otherwise as simple link. */
  displayAsPersona?: boolean;
}

const colors: PersonaInitialsColor[] = [
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
];

const personaContainer: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "start",
  fontSize: "12px",
  color: "#115ea3",
  cursor: "pointer",
  gap: 4,
};

export const Lookup = ({ onOpenLookup, info, displayAsPersona = false }: IProps) => {
  const { etn, id, name } = info.value as ComponentFramework.EntityReference;
  const initials = useMemo(() => getInitials(name, false), [name]);

  const handleClick = () => {
    etn && onOpenLookup(etn, id.guid);
  };

  if (displayAsPersona) {
    return (
      <div
        style={personaContainer}
        className="personaContainer personaContainer--with-coin"
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
      >
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
  }

  return (
    <button
      type="button"
      className="card-text card-info-value card-info-value--link"
      onClick={handleClick}
    >
      {name}
    </button>
  );
};
