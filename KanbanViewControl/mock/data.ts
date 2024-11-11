import {
  CardItem,
  ColumnItem,
  ViewItem
} from "../interfaces";

export const mockCards: CardItem[] = [
  {
    "id": "66e21a107329eb729084f9dc",
    "column": "todo",
    "title": {
      "label": "Title",
      "value": "Implement user authentication"
    },
    "tag": {
      "label": "Tag",
      "value": "low"
    },
    "description": {
      "label": "Description",
      "value": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis egestas, purus non tincidunt pulvinar, neque lectus sollicitudin libero, quis varius libero tortor nec turpis. Fusce sed fermentum risus, nec ullamcorper risus."
    },
    "detail1": {
      "label": "Sell Off",
      "value": 654103
    },
    "detail2": {
      "label": "Est. Amount",
      "value": 166939
    },
    "detail3": {
      "label": "Est. Close Date",
      "value": "2025/03/01"
    },
    "detail4": {
      "label": "Owner",
      "value": {
        id: {
          guid: 'random'
        },
        name: "Mário Rocha",
        etn: "systemuser"
      }
    }
  },
  {
    "id": "66e21a10755953f371d6cd8f",
    "column": "on-hold",
    "title": {
      "label": "Title",
      "value": "Build about us page in Website"
    },
    "tag": {
      "label": "Tag",
      "value": "medium"
    },
      "description": {
        "label": "Description",
        "value": "Consectetur adipiscing elit, dolor sit amet."
      },
      "detail1": {
        "label": "Sell Off",
        "value": 421644
      },
      "detail2": {
        "label": "Est. Amount",
        "value": 322748
      },
      "detail3": {
        "label": "Owner",
        "value": "Selma Warren"
      }
  },
  {
    "id": "66e21a106f13045d904944f2",
    "column": "todo",
    "title": {
      "label": "Title",
      "value": "Hubspot Integrator | Project initiation and planning"
    },
    "tag": {
      "label": "Tag",
      "value": "Medium"
    },
      "description": {
        "label": "Description",
        "value": "Mauris pellentesque commodo ullamcorper. Aenean posuere nec risus sit amet ullamcorper."
      },
      "detail1": {
        "label": "Sell Off",
        "value": 616211
      },
      "detail2": {
        "label": "Est. Amount",
        "value": 157112
      },
      "detail5": {
        "label": "Actual Amount",
        "value": 157112
      },
      "detail3": {
        "label": "Owner",
        "value": "Patsy Richardson"
      },
      "detail4": {
        "label": "Account",
        "value": {
          id: { guid: "test"},
          name: "novalogica",
          etn: "account"
        }
      },
  }
]

export const mockColumns: ColumnItem[] = [{
    id: "todo" as const,
    title: "⭐ Todo",
  },
  {
    id: "in-progress" as const,
    title: "🔃 In progress",
  },
  {
    id: "on-hold" as const,
    title: "🕛 On Hold",
  }
]

export const mockViews: ViewItem[] = [{
  key: "statuscode" as const,
  text: "Status",
  uniqueName: "statuscode",
  type: "OptionSet"
}, {
  key: "source" as const,
  text: "Source",
  uniqueName: "source",
  type: "OptionSet"
}, {
  key: "priority" as const,
  text: "Priority",
  uniqueName: "priority",
  type: "OptionSet"
}]