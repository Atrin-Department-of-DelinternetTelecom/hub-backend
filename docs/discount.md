# What is the discount?

Discount is a way to generate invoices by the system for a contract. the discount system enables us to calculate user payments for each contract at the end of the month.

**ATTENTION**
_when the state of a contract changes, the `applyDiscountsOrCharges` method will call and calculates the contract `ScheduledDiscount` to use in the client invoices._

# Discount Section

The discount system uses the following sections for calculations:

- Feegroup label
- Discount matrix
- Discount matrix rule

### Discount Matrix

Discount matrix is the first step of discount generating. the discount matrix contains the following configurations to calculate schedule discounts:

- Number of months
  _to determine whether apply the discount in a specific period or on each month_
- [Discount type](#discount-type)
  _determine whether of `Bono` discount or `Scheduled` discount has to generate_
- Accumulation
  _to control max of executed discounts_
- Force Execution
  _if the contract activation date has on the current month, the `ininDate` of execution, will be the same as the contract activation date_

For the first step of generating scheduled discounts for the client contracts, we need to find all of the contracts discounts matrices.
_matrix discounts attach to the contract by the [Feegroup labels](#feegroup-label)_
then, we should check whether the [rules](#matrix-rule) passes for the contract. and after checking the _Accumulation_ and [exclusions](#matrix-exclusion) we need to create `DiscountPending` to save the detail for generating the scheduled discounts.

### Discount Type

Discount types determine which types of discounts have to generate for invoices ([`Scheduled Bono`](#scheduled-bono) or [`Scheduled Discount`](#scheduled-discount)).

#### Scheduled Bono

When a bonus is attached to the discount system as a discount it will create a ScheduleBonus then if it activation time arrived the selected bonus will append to the contract and its cost will apply to the monthly invoice . so, it's another way to append a bonus to a contract.

### Feegroup Label

each fee group has two types of labelling. `Group Label` and `Label`. `group label` uses to attach a discount matrix to a contract. and a `label` uses to apply a rule to the discount matrix.

### Matrix Rule

Each matrix rule contains configurations that determine when and how the discount should apply to the contract. to control discount matrix execution we can attach some rules to it. matrix rule has the following configurations:

- [Rule type](#matrix-rule-types)
  _to determine when the discount matrix can apply to the contract_
- Max day target exists
  _to exclude contracts that older than entered days_
- Max day exists
  _to exclude labeled contracts that older than entered days_
- Excelude from fee change
  _??_

#### Matrix rule types

- Discount present:
  _to execute discount only when another discount executed_
- Labeled contract present:
  _to execute discount only when contract labeled by same label of rule_

### Matrix Exclusion

Matrix exclusion is a way to ignore a discount from execution when a contract has another executed discount matrix.
