# Draggable Kanban Control



This dataset PowerApps Component Framework control (PCF) allows users to see records in a kanban view format.


## Usage

Also, once the control is added, you need to provide the following properties:

| Property | Description    |
| :---:   | :---: |
| Business Process Flow Step Order | Define the order for your business process flow steps  |
| Notification Position | Enumeration value that defines toast message position   |


## View Types 

This dropdown adjusts automatically to the associated dataset view. If you add a new OptionSet column to the view, it will adjust and show the respective columns for the OptionSet options.

*For the 'Status Reason' column, if it is added to the view, you will only be able to see active statuses.*

## Card

The fields displayed on the card are not hard-coded; instead, they are dynamically received from the dataset view associated with this PCF (PowerApps Component Framework) control. This allows the card to automatically adapt to the data provided by the dataset, ensuring that the most relevant information is shown in real-time based on the dataset's current state.


## Notes
- Lookup fields can still be accessed from the card.
- When you drag the card to another column and update it, you will receive a toast message indicating whether the update succeeded or failed.
- When the selected 'View Type' is related to a business process flow, you will not be moved directly to another column. Instead, a popup with the record will automatically open, and you will need to manually update the business process flow stage.
   

### Deploy
In order to deploy to your environment you'll need to run this commands: 
   #### 1. Create your authentication profile using the pac auth create command
      pac auth create --url https://xyz.crm.dynamics.com 

   #### 2. If you have previously created an authentication profile, you can view all the existing profiles using the pac auth list command
      pac auth list
   #### 3. To switch between the previously created authentication profiles, use the pac auth select command:
      pac auth select --index <index of the active profile>
   #### 4. Ensure that you have a valid connection and push the component
      pac pcf push -pp <your publisher prefix>
   