# Delinternet Automated Discounts

- [Getting Started](#getting-started)
- [Discounts](#discounts)
  - [Discount Configuration](#discount-configuration)
  - [Discount Rules](#discount-rules)
- [Labeling](#labeling)
  - [Group Labeling](#group-labeling)
  - [Contract Labeling](#contract-labeling)
- [Logic Flow](#logic-flow)

---

## Getting Started

As the name suggests, **Automated Discounts** is a system that applies discounts to client contracts automatically in the background. Each discount must meet certain **conditions and rules** to be eligible for a contract.

We’ll begin by introducing how discounts are configured and how rules are defined. Then, we’ll dive into **labeling**, which is the core mechanism that connects discounts to specific groups of contracts.

---

## Discount Configuration

Automated discount settings are stored in the `gf_discounts_matrix` table. Each discount includes the following configuration options:

- **Alias**:  
  An arbitrary name for the discount.

- **Activation Date**:  
  The date after which the discount becomes eligible.

- **Number of Months**:  
  Defines how many months the discount should be applied (zero means infinite).

- **Stay**:  
  If enabled, this refunds the client if the discount is later canceled (affects invoices).

- **Discount Type**:  
  Can either be:

  - A cost discount (fixed or percentage), or
  - A bonus assignment (extra features, packages, etc.).

- **Accumulation**:  
  Limits how many times a discount can be applied to contracts.

- **TPV ID**:  
  A custom identifier used for reporting or invoice grouping.

- **Exclusion**:  
  Prevents this discount from being applied if a conflicting discount has already been applied.

- **Discount Combination**:  
  Not currently documented – TBD :)

> These fields configure the discount itself. But to **apply discounts under specific conditions**, we use rules.

---

## Discount Rules

To ensure discounts only apply to eligible contracts, each discount can include one or more rules stored in `gf_discounts_matrix_rules`.

A discount is applied **only if at least one rule is satisfied**.

### Rule Types

1. **`labeled_contract_present`**  
   Applies only if the client has a contract with a specific label.

2. **`discount_present`**  
   Applies only if a specific discount has already been applied to the contract.

3. **`labeled_contract_bono_present`**  
   Applies only if the contract has a specific bonus label.

### Global Rule Conditions

These can be applied across all rule types:

- **`maxDaysTargetExists`**:  
  The labeled contract must be active for a minimum number of days.

- **`maxDayExists`**:  
  Like the above, but evaluated slightly differently in logic.

- **`excludeFromFeeChange`**:  
  Currently unused, but reserved for future use.

---

## Labeling

Once discounts are defined, we need a way to **associate them with contracts**. That’s where labeling comes in.

There are two types of labels:

1. **Group Labels**: Organize sets of fee groups to attach discounts.
2. **Contract Labels**: Used within discount rules to target specific contract characteristics.

---

### Group Labeling

Group Labels are **human-readable names** used to group fee groups. For example, if you want to apply a discount to a set of contracts called `My Package`, you first create a Group Label with that name.

- Stored in: `gf_feegroups_group_label`
- Connects to fee groups via: `gf_feegroups_group_labels_xref` (many-to-many)
- Each discount (in `gf_discounts_matrix`) belongs to **one** Group Label (one-to-many)

> Think of Group Labels as the bridge between **contracts (via fee groups)** and **discount logic (via discount matrices).**

---

### Contract Labeling

These labels are also assigned to fee groups but are used in **rules**, not for grouping discounts directly.

- Stored in: `gf_feegroups_labels`
- Connected via: `gf_feegroups_labels_xref` (many-to-many)

For example, a `labeled_contract_present` rule may check whether a client has a contract with a specific label attached.

---

## Logic Flow

Now that we understand discounts and labeling, let’s go behind the scenes and explore **how the system applies discounts**.

### Step 1: `GfDiscountsPendingService@updateAllFromClient`

This is the **entry point** for applying discounts to a client. It does two things:

1. Calls `updateDiscountsPending`
2. Then calls `executePosibles`

---

### Step 2: `updateDiscountsPending`

This step:

- Removes all invalid `GfDiscountsPending` entries.
- Calculates and generates new `GfDiscountsPending` entries using:
  - `getPossibleFromClient` → `getPossiblePendingFromClient`

This process checks each contract to determine which discounts may apply based on **labeling** and **discount matrix rules**.

---

### Step 3: `getPossibleFromClient`

This method:

- Retrieves discount matrices that are active (`dateActivation` reached).
- Matches them to the client’s contracts via **fee group labeling**.
- Runs two major checks for each potential match:
  1. **Exclusion Check**
  2. **Rule Evaluation**

---

### Exclusion Check

A discount may be excluded based on:

1. **Accumulation Limit (`reachedAccumulation`)**  
   The matrix's max allowed applications has been reached.

2. **Incompatibility (`hasIncompatibility`)**  
   Another discount from the exclusion list has already been applied.

3. **Package-Level Exclusion (`DiscountingPackageService@checkExclusion`)**  
   Currently not in use.

---

### Rule Evaluation

Each applicable matrix then runs its **discount rules**:

- If **any rule passes**, the discount is marked as _possible_.
- If **none** pass, it is excluded (with reasons).

The result is a list of:

```ts
{ type: string, matrixId: number, typeId: number }
```

These are then transformed into `GfDiscountsPending` entries.

---

### Step 4: `executePosibles`

Until now, no discounts have been applied—just calculated.

This step:

- Runs in `GfDiscountsExecuteService`.
- Retrieves the generated `GfDiscountsPending` entries.
- For each one:
  - Re-checks some conditions (like accumulation, activation date).
  - Applies the discount based on its type (`cost` or `bonus`).
  - Creates `ScheduledDiscount` records that represent the real, applied discounts.

> After this step, the discounts are **actually applied** and visible on the client’s contracts.
