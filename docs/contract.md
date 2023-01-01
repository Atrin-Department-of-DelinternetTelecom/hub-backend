# Introduction

There is 4 type of contract on the `Delinternet` company:

- Cell (CELL)
- Fix (FIX)
- Internet (INTERNET)
- Tv (TV)

Each contract passes some step to activate for a client and has some use cases and involves some external technologies that will be described in following. also, each contract has a constant in the system that is uppercase of the contract type used to handle any data related to the contract.

The basic requirement of a contract is `FedGroup`. `FeeGroup`'s is a way to describe contract cost, technology, discounts and some other config for contract and related services. also, any of the four mentioned contract types have some different config and process to activate, that will discuss in related sections. But the following configurations are present in all contracts:

- FeeGroup (feeGroupId)
  _To describe and configure the contract technology_
- Alias (alias)
  _Custom Name For Contract_
- Payday (payDay)
  _Day of the month that the user should pay the invoice_
- Invoice Months (invoiceMonths)
  _The period length of invoicing(for example: per month). contains (1,2,3,6,12)_
- Percentage Discount (percentageDiscount)
  _To apply the discount to a specific contract_
- Invoice Profile (invoiceProfileId)
  _Client information used to generate invoice_
- Activation Date (dateActivation)
  _the date that contract activated (is necessary for invoicing)_
- Deactivation Date
  _The date that contract inactivated (is necessary for invoicing)_
- Comments (comments)

**The following fields only used on `Documents/XTA`. I don't know what is it**

- Permanence (permanence)
- Fi Permanencia (permanenceEnd)
- Price (permanencePvp)

each contract follows some steps to activate and during each step, the contract state will change that it contains two different status systems. one for the contract and the other for the `contract [section](#section)`. contract state keeps in the `state` column on the contract and the section state keeps in the `state` column of `GfContractSectionStatus`.

###### Section

When creating a contract, information about the type of contract (Internet, repair, etc.) is stored in another table. Each contract type has a separate table for the associated data, as follows:

- cell: GfContractDataCell
- Fix: GfContractDataFix
- Internet: GfContractDataInternet
- TV: GfContractDataTv

---

## Cell

The `CELL` key refers to the `Mobile` contracts.
To create a contract of type `CELL` you have to choose a `FeeGroup` of type `CELL` when creating a contract. so, the system generates a `GfContractDataCell` row to store configurations related to the `CELL` section. Each `CELL` contract requires a phone number (provided by `AIRE`) and an `ICC&DC` (SIM card number) to create. So, after saving data, you have to execute the `CELL` section then the system awaits `AIRE` activation. when contract executed, the AIRE service provides a `Provider request code` for the contract that means contract is fully activated.
So, to create a `CELL` contract have the following steps:

- 1. create a contract by `FeeGroup` of type `CELL`
- 2. go to the contract section and configure the `number` and `ICC&DC`
- 3. execute the contract section to sync by AIRE
- 4. await for AIRE activation

##### FLOW

After a `CELL` contract is created, its state will be in the `pendingSectionReady` and its section will have the `empty` state. After configuring and saving the section, if the status of the section was not `executed`, the system will change it to `pending`. After executing the `CELL` section, the system tries to get a provider request code (`providerReserveCode`) from AIRE. If everything is well configured, the AIRE service returns a code then the contract will activate and the section state change to `executed`.

###### Section Fields

A `FIX` section has the following configuration:

- Number (number)
  _the cell phone number_
  _it provides by AIRE service_
- ICC and DC (icc & iccControlDigit)
  _the SIM card number_
  _it provides by operator and company_
- Sim payment method (simPaymentMethod)

---

## FIX

The `FIX` key refers to the `Fiber Optic` contracts.
To create a contract of type `FIX` you have to choose a `FeeGroup` of type `Fix` when creating a contract. so, the system generates a `GfContractDataFix` row to store configurations related to the `FIX` section. each FIX contract require a phone number (provides by operator) and an active [`INTERNET`](#internet) contract to create. after configuring the requirements you have to configure the `IVOZ` system and execute it. if `IVOZ` configured correctly the contract will activate. So, creating a `FIX` contract has the following steps

- 1. create an Internet contract
- 2. create a contract by `FeeGroup` of type `FIX`
- 3. go to the contract section and configure the `number` and attach `internet` to it
- 4. configure the `IVOZ` and execute it

##### FLOW

After a `FIX` contract is created, its state will be in the `pendingSectionReady` and its section will have the `empty` state. After configuring and saving the section, if the status of the section was `empty`, the system will change it to `Pending` so as not to prevent `Kamailio` from running. then after configuring and executing the `IVOZ` if it is correctly configured the contract will activate and will have the `active` state (Also for it section).

###### Section Fields

A `FIX` section has the following configuration:

- Portability (portability)
  _Determine that contract is portable or not_
  _A contract is portable if the user already has a phone number_
- Have tele assistance (haveTeleassistance)
- Giver operator (giverOperator)
- Number (number)
  _The phone number for contract_
- Type (type)
  _(is:particular,company)_
- Idtpv (idTpv)
- Internet Section (internetSectionId)
  _Id of related internet contract_
- Auto execute date (autoExecuteDate)
  _if changed an installation event will generate for the installer users_
- Direct IP (directIp)
- Aire execute date (aireExecuteDate)
- Extension (extension)
- Password (password)
- Description (description)

---

## Internet

The `INTERNET` key refers to the `Internet` contracts.
To create a contract of type `INTERNET` you have to choose a `FeeGroup` of type `INTERNET` when creating a contract. so, the system generates a `GfContractDataInternet` row to store configurations related to the `INTERNET` section. each INTERNET contract need to configure [`radius`](#radius) and [`CPE`](#cpe) to activate. so, you have to follow the below steps to creating an `INTERNET` contract:

- 1. create a contract by `FeeGroup` of type `INTERNET`
- 2. go to the contract section and [configure](#configure-radius) the `radius`
- 3. go to the contract section and [configure](#configure-cpe) the `CPE`
- 3. go to the contract section and update installation address and upload images of configurations
- 4. go to the contract section and change section installation to done (check the `installationDone`)

After these steps, when you save the `INTERNET` section form, if the installation was done, the contract will execute and if everything was configured correctly, it will activate. but, this type of contract has the other states during execution that listed below:

- step1
  _when address filled but installation is not done_
- step2
  _when the installation date is set and the installer user chosen_
- step2.5
  _when installation set as done_
  _this is the only step the `radius` operation runs_
- step2.7
  _when installation is done and automatic `radius` operation or `cpe` operation is fail_
  _cpe or radius no well configured_
- waitingRadius
  _when installation is done and automatic `radius` operation is success_
  _all ok, waiting for first radius connection_

###### Section Fields

An `INTERNET` section has the following configuration:

- Instalation date and hour (instalationDate)
  _date of physical installation_
- Installer (installatorUserId)
  _Id of installator user_
- Installation level (installationLevel)
  _Level of installation_
  _used only for reports and have no effect in system_
- Installation done (installationDone)
  _status of installation process_
  _it is the last step of installing internet contracts_
  _when the installation is done if the contract is not active yet, the system tries to activate and execute the contract when saving the INTERNET section_

###### configure radius

Radius is an external service that is involved in `INTERNET` contracts. configuration of it does automatically through its API.

###### configure cpe

The `CPE` system store the physical wifi configurations of contract and its another external service that involved in `INTERNET` contracts. this section provides the following services:

- set wifi password
- set wifi SSID
- reboot the wifi
- reset the wifi configurations
- factory reset the wifi

## Tv

The `TV` key refers to the `Television` contracts.
To create a contract of type `TV` you have to choose a `FeeGroup` of type `TV` when creating a contract. so, the system generates a `GfContractDataTv` row to store configurations related to the `TV` section. each TV contract require an active [`INTERNET`](#internet) contract to create. So, creating a `TV` contract has the following steps:

- 1. create an Internet contract
- 2. create a contract by `FeeGroup` of type `TV`
- 3. go to the contract section and attach `internet` to it
