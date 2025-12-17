/**
 * Airtable Schema Definition
 * This file defines the expected schema for all Airtable tables.
 * Used for schema verification to prevent drift.
 * 
 * Note: 'required' flags are for application-level validation only.
 * Airtable does not enforce required fields at the database level.
 */

export type FieldType =
  | 'singleLineText'
  | 'multilineText'
  | 'email'
  | 'url'
  | 'phoneNumber'
  | 'number'
  | 'percent'
  | 'currency'
  | 'singleSelect'
  | 'multipleSelects'
  | 'date'
  | 'dateTime'
  | 'checkbox'
  | 'rating'
  | 'multipleRecordLinks'
  | 'singleCollaborator'
  | 'multipleCollaborators'
  | 'formula'
  | 'rollup'
  | 'count'
  | 'multipleAttachments'
  | 'barcode'
  | 'button'
  | 'createdBy'
  | 'createdTime'
  | 'lastModifiedBy'
  | 'lastModifiedTime'
  | 'externalSyncSource'

export interface FieldDefinition {
  name: string
  type: FieldType
  options?: {
    choices?: Array<{ name: string; color?: string }>
    precision?: number
    symbol?: string
  }
  required?: boolean // Application-level validation only
}

export interface TableDefinition {
  name: string
  fields: FieldDefinition[]
}
export const AIRTABLE_SCHEMA: TableDefinition[] = [
  {
    name: 'Businesses',
    fields: [
      { name: 'Name', type: 'singleLineText' },
      { name: 'Timezone', type: 'singleLineText' },
      { name: 'Phone', type: 'phoneNumber' },
      { name: 'Email', type: 'email' },
      { name: 'Active', type: 'checkbox' },
      { name: 'Vapi Number', type: 'singleLineText' },
      { name: 'Human Handover Number', type: 'singleLineText' },
      { name: 'Handover Enabled', type: 'checkbox' },
      { name: 'Handover Description', type: 'multilineText' },
      { name: 'Hours JSON', type: 'multilineText' },
      // Linked record fields from other tables
      { name: 'Leads', type: 'multipleRecordLinks' },
      { name: 'Interactions', type: 'multipleRecordLinks' },
      { name: 'Appointments', type: 'multipleRecordLinks' },
      { name: 'PromptOverrides', type: 'multipleRecordLinks' },
      { name: 'Automations', type: 'multipleRecordLinks' },
      { name: 'BusyBlocks', type: 'multipleRecordLinks' },
      { name: 'Users', type: 'multipleRecordLinks' },
      // Note: If you want "Created" field, add it manually in Airtable as "Created time" type
    ],
  },
  {
    name: 'Onboarding',
    fields: [
      { name: 'Company Name', type: 'singleLineText' },
      { name: 'Email', type: 'email' },
      { name: 'Phone', type: 'phoneNumber' },
      { name: 'Industry', type: 'singleLineText' },
      { name: 'Use Case', type: 'singleLineText' },
      { name: 'Team Size', type: 'singleLineText' },
      { name: 'Expected Volume', type: 'singleLineText' },
      { name: 'Onboarding Notes', type: 'multilineText' },
      { name: 'Status', type: 'singleSelect', options: { choices: [
        { name: 'New', color: 'blueLight2' },
        { name: 'Contacted', color: 'yellowLight2' },
        { name: 'Converted', color: 'greenLight2' },
        { name: 'Archived', color: 'grayLight2' },
      ] } },
    ],
  },
  {
    name: 'Leads',
    fields: [
      { name: 'Name', type: 'singleLineText' }, // removed required
      { name: 'Phone', type: 'phoneNumber' },
      { name: 'Email', type: 'email' },
      { name: 'Status', type: 'singleSelect', options: { choices: [
        { name: 'New', color: 'blueLight2' },
        { name: 'Contacted', color: 'yellowLight2' },
        { name: 'Qualified', color: 'greenLight2' },
        { name: 'Closed', color: 'greenDark1' },
        { name: 'Lost', color: 'redLight2' },
      ] } },
      { name: 'Business', type: 'multipleRecordLinks' },
      { name: 'Industry', type: 'singleLineText' },
      { name: 'Use Case', type: 'singleLineText' },
      { name: 'Team Size', type: 'singleLineText' },
      { name: 'Expected Volume', type: 'singleLineText' },
      { name: 'Onboarding Notes', type: 'multilineText' },
      // Linked record fields
      { name: 'Interactions', type: 'multipleRecordLinks' },
      { name: 'Appointments', type: 'multipleRecordLinks' },
    ],
  },
  {
    name: 'Interactions',
    fields: [
      { name: 'Name', type: 'singleLineText' }, // Primary field (auto-created by Airtable)
      { name: 'Lead', type: 'multipleRecordLinks' },
      { name: 'Business', type: 'multipleRecordLinks' },
      { name: 'Type', type: 'singleSelect', options: { choices: [
        { name: 'Call', color: 'blueLight2' },
        { name: 'SMS', color: 'greenLight2' },
        { name: 'Email', color: 'purpleLight2' },
      ] } },
      { name: 'Transcript', type: 'multilineText' }, // removed required
      { name: 'Start UTC', type: 'dateTime' },
      { name: 'End UTC', type: 'dateTime' },
      { name: 'Duration', type: 'number' },
      { name: 'Direction', type: 'singleSelect', options: { choices: [
        { name: 'Inbound', color: 'blueLight2' },
        { name: 'Outbound', color: 'orangeLight2' },
      ] } },
      { name: 'Status', type: 'singleSelect', options: { choices: [
        { name: 'ringing', color: 'yellowLight2' },
        { name: 'in-progress', color: 'blueLight2' },
        { name: 'completed', color: 'greenLight2' },
        { name: 'failed', color: 'redLight2' },
        { name: 'transferred', color: 'purpleLight2' },
        { name: 'missed', color: 'redLight2' },
      ] } },
      { name: 'Outcome', type: 'singleSelect', options: { choices: [
        { name: 'booked', color: 'greenLight2' },
        { name: 'info', color: 'blueLight2' },
        { name: 'transferred', color: 'purpleLight2' },
        { name: 'followup', color: 'yellowLight2' },
        { name: 'spam', color: 'redLight2' },
        { name: 'unknown', color: 'grayLight2' },
      ] } },
      { name: 'Call ID', type: 'singleLineText' }, // removed required
      { name: 'From Number', type: 'singleLineText' },
      { name: 'To Number', type: 'singleLineText' },
      { name: 'Transferred To Human', type: 'checkbox' },
      { name: 'Transfer Destination', type: 'singleLineText' },
      { name: 'Transfer Status', type: 'singleSelect', options: { choices: [
        { name: 'requested', color: 'yellowLight2' },
        { name: 'success', color: 'greenLight2' },
        { name: 'failed', color: 'redLight2' },
      ] } },
      { name: 'Transfer Reason', type: 'singleSelect', options: { choices: [
        { name: 'Scheduling issue', color: 'yellowLight2' },
        { name: 'Pricing', color: 'orangeLight2' },
        { name: 'Emergency', color: 'redLight2' },
        { name: 'Complex request', color: 'blueLight2' },
        { name: 'Other', color: 'grayLight2' },
      ] } },
    ],
  },
  {
    name: 'Appointments',
    fields: [
      { name: 'Name', type: 'singleLineText' },
      { name: 'Lead', type: 'multipleRecordLinks' },
      { name: 'Business', type: 'multipleRecordLinks' },
      { name: 'Start UTC', type: 'dateTime' },
      { name: 'End UTC', type: 'dateTime' },
      { name: 'Status', type: 'singleSelect', options: { choices: [
        { name: 'HOLD', color: 'yellowLight2' },
        { name: 'CONFIRMED', color: 'greenLight2' },
        { name: 'CANCELLED', color: 'redLight2' },
        { name: 'COMPLETED', color: 'blueLight2' },
      ] } },
      { name: 'Notes', type: 'multilineText' },
    ],
  },
  {
    name: 'PromptOverrides',
    fields: [
      { name: 'Name', type: 'singleLineText' },
      { name: 'Business', type: 'multipleRecordLinks' },
      { name: 'Key', type: 'singleLineText' },
      { name: 'Value', type: 'multilineText' },
      { name: 'Active', type: 'checkbox' },
    ],
  },
  {
    name: 'Automations',
    fields: [
      { name: 'Name', type: 'singleLineText' },
      { name: 'Business', type: 'multipleRecordLinks' },
      { name: 'Trigger', type: 'singleSelect', options: { choices: [
        { name: 'Lead Created', color: 'blueLight2' },
        { name: 'Lead Status Changed', color: 'yellowLight2' },
        { name: 'Interaction Completed', color: 'greenLight2' },
      ] } },
      { name: 'Conditions', type: 'multilineText' },
      { name: 'Actions', type: 'multilineText' },
      { name: 'Active', type: 'checkbox' },
    ],
  },
  {
    name: 'BusyBlocks',
    fields: [
      { name: 'Name', type: 'singleLineText' },
      { name: 'Business', type: 'multipleRecordLinks' },
      { name: 'Start UTC', type: 'dateTime' },
      { name: 'End UTC', type: 'dateTime' },
      { name: 'Reason', type: 'singleLineText' },
      { name: 'Recurring', type: 'checkbox' },
    ],
  },
  {
    name: 'Users',
    fields: [
      { name: 'Name', type: 'singleLineText' },
      { name: 'Email', type: 'singleLineText' },
      { name: 'Role', type: 'singleSelect', options: { choices: [
        { name: 'Owner', color: 'blueLight2' },
        { name: 'Staff', color: 'yellowLight2' },
        { name: 'Admin', color: 'greenLight2' },
      ] } },
      { name: 'Business', type: 'multipleRecordLinks' },
    ],
  },
]


export function getTableDefinition(tableName: string): TableDefinition | undefined {
  return AIRTABLE_SCHEMA.find((table) => table.name === tableName)
}

export function getFieldDefinition(
  tableName: string,
  fieldName: string
): FieldDefinition | undefined {
  const table = getTableDefinition(tableName)
  return table?.fields.find((field) => field.name === fieldName)
}
