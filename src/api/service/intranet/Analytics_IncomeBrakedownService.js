'use strict';

const { sequelize, GfCollaborator } = require('@models').intranet;
const { QueryTypes } = require('sequelize');
const { getMyCollaborator } = require('./GfCollaboratorService');
const _ = require('lodash');
const { respondSuccess } = require('@utils/response');
const Excel = require('exceljs');

exports.buildFoto = async (periodId) => {
  const query = `
    DROP TEMPORARY TABLE IF EXISTS taulafees;
    SET @PERIODID := ${periodId};
    SET @transitUnitPrice := (SELECT transitUnitPrice FROM gf_invoice_periods WHERE id = @PERIODID) ;
    SET @transportUnitPrice := 
    (SELECT transportUnitPrice FROM gf_invoice_periods WHERE id = @PERIODID) ;

    SET @infraIpUnitPrice := 
    (SELECT 
      infraIpUnitPrice 
    FROM
      gf_invoice_periods 
    WHERE id = @PERIODID) ;

    SET @supportUnitPrice := 
    (SELECT 
      supportUnitPrice 
    FROM
      gf_invoice_periods 
    WHERE id = @PERIODID) ;

    SET @guifiRadioStructureUnitPrice := 
    (SELECT 
      guifiRadioStructureUnitPrice 
    FROM
      gf_invoice_periods 
    WHERE id = @PERIODID) ;

    CREATE TEMPORARY TABLE taulafees 
    (SELECT 
      gf_fee_groups.id AS feeGroupId,
      gf_fee_groups.active,
      gf_fee_groups.status AS statusfeegroups,
      gf_fees.status AS statusfee,
      (SELECT 
        COUNT(*) 
      FROM
        gf_contracts 
      WHERE feeGroupid = gf_fee_groups.id 
        AND gf_contracts.status = 1 
        AND gf_contracts.state = "active") AS linies,
      gf_fee_groups.name,
      gf_fees.tpvCode,
      gf_fee_groups.internalName,
      gf_fees.internetTechnology AS Tech,
      gf_fees.internetTechnologyAnalitic AS camptechrev,
      gf_fees.internetIncludedMb AS Mb,
      gf_fees.internetSLAType AS SLAType,
      gf_fees.baseQuote,
      gf_fees.internetcapextype AS capexid,
      (SELECT 
        NAME 
      FROM
        gf_capex_types 
      WHERE gf_capex_types.id = gf_fees.internetCapexType) AS nomcapex,
      gf_capex_types.supplier AS Supplier,
      gf_capex_types.troncal,
      gf_capex_types.user,
      gf_fees.internetInfraIp AS infraIp,
      gf_fees.internetSLAe AS AltSLAe,
      (
        IF(
          gf_fees.internetSLAType = "24x7-8h",
          102.64,
          IF(
            gf_fees.internetSLAType = "8x5-8h",
            44.79,
            0
          )
        )
      ) AS costSLA,
      gf_capex_types.transit,
      gf_capex_types.transport,
      gf_capex_types.support,
      gf_capex_types.guifi,
      gf_capex_types.estructZona,
      (
        gf_fees.baseQuote - gf_capex_types.troncal - gf_capex_types.user - IF(gf_fees.internetInfraIp = 1, 2, 0) - (IFNULL(internetSLAe, 0)) - IF(
          gf_fees.internetSLAType = "24x7-8h",
          102.64,
          IF(
            gf_fees.internetSLAType = "8x5-8h",
            44.79,
            0
          )
        ) - IF(
          gf_capex_types.transit = 1,
          @transitUnitPrice,
          0
        ) - IF(
          gf_capex_types.transport = 1,
          @transportUnitPrice,
          0
        ) - IF(
          gf_capex_types.support = 1,
          @supportUnitPrice,
          0
        ) - IF(
          gf_capex_types.supplier = "guifi.net",
          1,
          0
        ) - IF(
          gf_capex_types.estructZona = 1,
          @guifiRadioStructureUnitPrice,
          0
        )
      ) AS calcul,
      gf_fees.initialCostTpvCode AS ICTPVcode,
      gf_fees.initialCost AS InitCost,
      gf_fees.internetPercentageRule AS Rulerev,
      gf_fees.internetTax,
      gf_capex_types.percentage,
      gf_capex_types.global 
    FROM
      gf_fees 
      LEFT JOIN gf_capex_types 
        ON gf_capex_types.id = internetCapexType 
      LEFT JOIN gf_fee_groups 
        ON gf_fee_groups.id = feeGroupId 
      LEFT JOIN gf_feegroups_sections_xref 
        ON gf_feegroups_sections_xref.feeGroupId = gf_fee_groups.id 
      LEFT JOIN gf_sections 
        ON gf_sections.id = sectionId 
    WHERE #gf_fees.status = 1 
      #AND gf_fee_groups.status = 1 
      # AND 
      gf_sections.code != 'CELL' 
      AND gf_sections.code != 'FIX' #AND gf_fees.internetTechnology = 'radio' 
    GROUP BY tpvCode 
    ORDER BY gf_fee_groups.name ASC) ;

    DROP TEMPORARY TABLE IF EXISTS liniesfra ;

    SET @PERIODID := ${periodId} ;

    SET @liquidationDateEnd := 
    (SELECT 
      DATE(liquidationDateEnd) 
    FROM
      gf_invoice_periods 
    WHERE id = @PERIODID) ;

    SET @liquidationDateInit := 
    (SELECT 
      DATE(liquidationDateInit) 
    FROM
      gf_invoice_periods 
    WHERE id = @PERIODID) ;

    CREATE TEMPORARY TABLE liniesfra 
    (SELECT 
      gf_clients.id AS clientId,
      gf_clients.name,
      invoice_invoice.code AS invoiceCode,
      invoice_invoice.id,
      invoice_invoice.payDate,
      invoice_invoice.date,
      invoice_lines.description,
      gf_contracts.reference,
      invoice_products.code AS productCode,
      invoice_lines.subTotal AS totalLinea,
      invoice_lines.refererKey,
      invoice_lines.id AS lineasid,
      gf_contracts.id AS contractId,
      IF (
        (
          invoice_lines.refererData LIKE '%"productKey":"matrix:%' 
          OR invoice_lines.refererData LIKE '%"productKey":"manualDiscount"%'
        ) 
        AND invoice_lines.productCode NOT IN (
          "GouFidel_Descompte",
          "GOU_Descompte",
          "GT_DescClientFidel"
        ),
        (SELECT 
          productCode 
        FROM
          invoice_lines AS tt 
        WHERE invoice_lines.invoiceId = tt.invoiceId 
          AND tt.refererKey = invoice_lines.refererKey 
          AND tt.refererData LIKE '%"productKey":"fee:%' 
        LIMIT 0, 1),
        invoice_lines.productCode
      ) AS codeSumatori,
      IF (
        invoice_lines.refererData LIKE '%"productKey":"fee:%',
        1,
        0
      ) AS isFee,
      IF (
        invoice_lines.refererData LIKE '%"productKey":"bono:%',
        1,
        0
      ) AS isBono,
      IF (
        gf_contracts.collaboratorId > 0,
        (SELECT 
          NAME 
        FROM
          gf_collaborators 
        WHERE gf_collaborators.id = gf_contracts.collaboratorId),
        (SELECT 
          NAME 
        FROM
          gf_collaborators 
        WHERE gf_collaborators.id = gf_clients.collaboratorId)
      ) AS collabortor,
      IF (
        gf_contracts.collaboratorId > 0,
        "by contract",
        "by client"
      ) collaboratorType,
      (SELECT 
        (SELECT 
          CODE 
        FROM
          gf_sections 
        WHERE id = sectionId) 
      FROM
        gf_contracts_section_status 
      WHERE contractId = gf_contracts.id 
        AND gf_contracts_section_status.status = 1 limit 0,1) AS contractType 
    FROM
      invoice_lines 
      LEFT JOIN invoice_invoice 
        ON invoice_invoice.id = invoice_lines.invoiceId 
      LEFT JOIN gf_clients 
        ON gf_clients.invoiceClientId = invoice_invoice.clientId 
      LEFT JOIN gf_contracts 
        ON gf_contracts.id = REPLACE(
          invoice_lines.refererKey,
          "contractId:",
          ""
        ) 
      LEFT JOIN invoice_products 
        ON invoice_products.id = invoice_lines.productId 
    WHERE (
        invoice_invoice.date >= 
        (SELECT 
          DATE(liquidationDateInit) 
        FROM
          gf_invoice_periods 
        WHERE id = @PERIODID) 
        AND invoice_invoice.date <= 
        (SELECT 
          DATE(liquidationDateEnd) 
        FROM
          gf_invoice_periods 
        WHERE id = @PERIODID)
      ) 
      AND invoice_lines.status = 1 
      AND invoice_invoice.status = 1 
      AND invoice_products.code != "SIM" 
      AND invoice_products.code != "23MO0030") ;

    DROP TEMPORARY TABLE IF EXISTS finalFoto ;
    CREATE TEMPORARY TABLE finalFoto 
  (SELECT 
    #Variables
    #Percentage Rules
    @RMOB := 0.7 AS RMOB,
    @RFIX := 0.5 AS RFIX,
    @RINET := 0.7 AS RINET,
    @RBONO := 0.5 AS RBONO,
    @RCLMOB := 0.32 AS RCLMOB,
    #Periode as per gf_invoice_periods
    @PERIODID := ${periodId} AS periodId,
    # desembre de 2017
    #Note: Pendent declarar millor els períodes del consum i del càlcul de comis
    #Other useful fields
    taulafees.supplier AS supplierFees,
    #Note: it's only fee supplier, NOT for all products and Bono
    @macroSup := IF (
      taulafees.supplier = "guifi.net" 
      OR taulafees.supplier = 0 
      OR taulafees.supplier IS NULL,
      "propi",
      "lloguer"
    ) AS macroSup,
    gf_bonus.percentageRule AS typeBono,
    liniesfra.*,
    #Basenumbers
    @tanper1 := IFNULL(
      liniesfra.totalLinea / IF (
        taulafees.baseQuote > 0,
        taulafees.baseQuote,
        gf_bonus.pvp
      ),
      1
    ) AS tanper1,
    @price := IF (
      taulafees.baseQuote > 0,
      taulafees.baseQuote,
      gf_bonus.pvp
    ) AS price,
    #Internet   
    #Costs INET    
    @transit1 := IFNULL(@tanper1 * taulafees.transit, 0) AS transit1,
    @transport1 := IFNULL(@tanper1 * taulafees.transport, 0) AS transport1,
    @infraIP1 := IFNULL(@tanper1 * taulafees.infraIp, 0) AS infraIP1,
    @Support1 := IFNULL(@tanper1 * taulafees.support, 0) AS Support1,
    @transit := IFNULL(@tanper1 * taulafees.transit, 0) AS transit,
    @transport := IFNULL(@tanper1 * taulafees.transport, 0) AS transport,
    @infraIP := IFNULL(@tanper1 * taulafees.infraIp, 0) AS infraIP,
    @Support := IFNULL(@tanper1 * taulafees.support, 0) AS Support,
    @despllog := IFNULL(
      IF(
        @macroSup = "lloguer",
        @tanper1 * taulafees.troncal,
        0
      ),
      0
    ) AS despllog,
    @AllcostsINET := @transit + @transport + @infraIP + @Support + @despllog AS AllcostsINET,
    #Net
    @_capexTronc := IFNULL(
      IF(
        gf_bonus.percentageRule IN (
          "Bonocapex",
          "Bonodonacio",
          "Bonofinan"
        ),
        (liniesfra.totalLinea),
        (@tanper1 * taulafees.troncal)
      ),
      0
    ) AS _capexTronc,
    @capexTronc := IF(
      @macroSup = "propi",
      @_capexTronc,
      0
    ) AS capexTronc,
    @drops := IFNULL(@tanper1 * taulafees.user, 0) AS drops,
    @opex := IF (
      (
        taulafees.supplier = "guifi.net" 
        AND isFee = 1
      ),
      (@tanper1 * 1),
      0
    ) AS opex,
    @capexTot := @drops + @capexTronc AS capexTot,
    @estructura := IFNULL(
      @tanper1 * taulafees.estructZona,
      0
    ) AS estructura,
    @servei := IFNULL((@tanper1 * taulafees.calcul), 0) AS servei,
    #INET other incomes (MB aditionals, SLA) --> Bonos
    @ingrBrutBono := IF (
      gf_bonus.percentageRule = "INTERNET",
      liniesfra.totalLinea,
      0
    ) AS ingrBrutBono,
    @SLA := IF (
      gf_bonus.percentageRule = "SLA",
      liniesfra.totalLinea,
      (
        @tanper1 * IFNULL(taulafees.costSLA, 0)
      ) + (
        @tanper1 * IFNULL(taulafees.AltSLAe, 0)
      )
    ) AS SLA,
    #COST grup
    @incomeIP := IF (
      gf_bonus.percentageRule = "IP",
      liniesfra.totalLinea,
      0
    ) AS incomeIP,
    @altresbonos := IF (
      (
        gf_bonus.percentageRule = "Transport" 
        OR gf_bonus.percentageRule = "serveisexterns" 
        OR gf_bonus.percentageRule = "Tele"
      ),
      liniesfra.totalLinea,
      0
    ) AS altresbonos,
    #Otherbusiness
    #RentMaterial
    #Note: Net CAPEX zone--> amount net zone
    @materialllog := IF (
      gf_bonus.percentageRule = "Material",
      liniesfra.totalLinea,
      0
    ) AS materialllog,
    #Voip
    #Income
    @ingrBrutFix := IF(
      liniesfra.contractType = "FIX" 
      AND IFNULL(gf_bonus.percentageRule, "") != "material",
      liniesfra.totalLinea,
      0
    ) AS ingrBrutFix,
    #Cost
    @costFixFees := IFNULL(
      IF(
        liniesfra.isFee = 1,
        costI + costR + costM + costN,
        0
      ),
      0
    ) AS costFixFees,
    @costFixDtes := IF(
      productCode IN (
        "GOU_Descompte",
        "GT_DescClientfidel"
      ),
      liniesfra.totalLinea,
      0
    ) AS costFixDtes,
    #Note: Missingcosts to assign: Procescontrol billcost + Tarifes planes + WebFax
    #Note: Losts to declare: Suma fra aire i tu call menys costsFixFees
    #Net
    @ingrNetFix := @ingrBrutFix - @costFixFees + @costFixDtes AS ingrNetFix,
    #Mobile
    #Income
    @ingrBrutMob := IF(
      liniesfra.contractType = "CELL",
      (
        liniesfra.totalLinea * IF(
          liniesfra.productCode IN ("TMIDISF", "MO10ILLI/001"),
          0.1,
          0.25
        )
      ),
      0
    ) AS ingrBrutmob,
    #Cost
    @despaire := IF(
      liniesfra.contractType = "CELL",
      (
        liniesfra.totalLinea * IF(
          liniesfra.productCode IN ("TMIDISF", "MO10ILLI/001"),
          0.9,
          0.75
        )
      ),
      0
    ) AS despaire,
    @costLiniaCell := IF(
      liniesfra.contractType = "CELL" 
      AND liniesfra.productCode NOT LIKE "%CONSUM%",
      @ingrBrutMob * @RCLMOB,
      0
    ) AS costLiniaCell,
    @costMobDtes := IF(
      productCode IN ("GouFidel_Descompte"),
      liniesfra.totalLinea,
      0
    ) AS costMobDtes,
    #Net  
    @ingrNetMob := @ingrBrutMob - @costLiniaCell + @costMobDtes AS ingrNetMob,
    #ColaboratorPercentage & Net income
    @serveiColInet := @servei * @RINET AS serveiColInet,
    @ingrBono := @ingrBrutBono * @RBONO AS ingrBono,
    @slaIngr := @SLA * @RBONO AS slaIngr,
    @colRentMat := @materialllog AS colRentMat,
    @ServeiColMob := @ingrNetMob * @RMOB AS ServeiColMob,
    @ServeiColFix := @ingrNetFix * @RFIX AS ServeiColFix,
    @ingTotNoInv := @opex + @estructura + @serveiColInet + @ingrBono + @slaIngr + @colRentMat + @ServeiColFix + @ServeiColMob AS ingTotNoInv,
    @ingTotonlyDrops := @drops + @ingTotNoInv AS ingTotonlyDrops,
    @ingTotAmbInv := @capexTot + @ingTotNoInv AS ingTotAmbInv,
    #falta fer escandall grup Goufone i costos
    #validacio resultats  
    @validacio := @AllcostsINET + @capexTot + @opex + @estructura + @servei + @ingrBrutBono + @SLA + @incomeIP + @altresbonos + @materialllog + @ingrNetFix + @costFixFees + @ingrNetMob + @costLiniaCell + @despaire AS validacio,
    @validacio - totalLinea AS diferencia,
    #totalLinea,
    #partq estic fent AS totallinearev,
    #part taxa 1,5%
    taulafees.internetTax AS internetTax,
    @peatge := @transit + @transport + @capexTronc + @drops + @estructura + @opex + @SLA AS peatge,
    IF (
      taulafees.internetTax > 0,
      (@peatge * taulafees.internetTax) / 100,
      0
    ) AS importTax 
  FROM
    liniesfra 
    LEFT JOIN taulafees 
      ON taulafees.tpvCode = liniesfra.codeSumatori 
    LEFT JOIN gf_bonus 
      ON gf_bonus.tpvCode = productCode 
    LEFT JOIN gf_kamailio_historic_edges 
      ON periodId = @PERIODID 
      AND gf_kamailio_historic_edges.contractId = liniesfra.contractId 
      AND gf_kamailio_historic_edges.status = 1) ;
`;

  await sequelize.query(query).catch((err) => console.log(err));
};

exports.summaryBox = async () => {
  const query = `SELECT 
    #camps1rataulamacro
    collabortor AS Col,
    macroSup,
    #typeBono,
    ROUND(SUM(ingTotAmbInv), 2) AS ingTotAmbInv,
    ROUND(SUM(ingTotNoInv), 2) AS ingTotNoInv,
    ROUND(SUM(drops), 2) AS drops,
    ROUND(SUM(capexTronc), 2) AS capexTronc,
    ROUND(SUM(capexTot), 2) AS capexTot,
    ROUND(SUM(opex), 2) AS opex,
    ROUND(SUM(estructura), 2) AS EstrRe,
    ROUND(SUM(materialllog), 2) AS matllog,
    ROUND(SUM(slaIngr), 2) AS slaIngr,
    ROUND(SUM(ingrBono), 2) AS ingrBono,
    ROUND(SUM(serveiColInet), 2) AS ServeiInet,
    ROUND(SUM(ServeiColMob), 2) AS ServeiMob,
    ROUND(SUM(ServeiColFix), 2) AS ServeiFix   
    FROM
      finalFoto #camps1rataulamacro 
    GROUP BY collabortor,
    macroSup #Agrupacions`;

  try {
    return await sequelize.query(query, {
      plain: false,
      raw: false,
      type: QueryTypes.SELECT,
    });
  } catch (error) {
    return [];
  }
};

exports.allLines = async () => {
  const query = `SELECT 
  collabortor AS Col,
  clientId,
  NAME,
  reference,
  description,
  macroSup,
  IFNULL(supplierFees,'aireobonos') AS supplier,
  #typeBono,
  ROUND(tanper1,2) AS tanper1,
  totalLinea,
  ROUND(ingTotAmbInv,2) AS ingTotAmbInv,
  ROUND(ingTotNoInv,2) AS ingTotNoInv,
  ROUND(drops,2) AS drops,
  ROUND(capexTronc,2) AS capexTronc,
  ROUND(capexTot,2) AS capexTot,
  ROUND(opex,2) AS opex,
  ROUND(estructura,2) AS EstrRe,
  ROUND(materialllog,2) AS matllog,
  ROUND(slaIngr,2) AS slaIngr,
  ROUND(ingrBono,2) AS ingrBono,
  ROUND(serveiColInet,2) AS ServeiInet,
  ROUND(ServeiColMob,2) AS ServeiMob,
  ROUND(ServeiColFix,2) AS ServeiFix,
  ROUND(importTax) AS importTax

   FROM finalFoto`;

  try {
    return await sequelize.query(query, {
      plain: false,
      raw: false,
      type: QueryTypes.SELECT,
    });
  } catch (error) {
    return {};
  }
};

exports.tTContribution = async () => {
  const query = `SELECT 
    collabortor AS Col,
    ROUND(SUM(transit1),2) AS transit1,
    ROUND(SUM(transport1),2) AS transport1
    FROM finalFoto
    GROUP BY collabortor;
  `;

  try {
    return await sequelize.query(query, {
      plain: false,
      raw: false,
      type: QueryTypes.SELECT,
    });
  } catch (error) {
    return [];
  }
};

exports._getAll = async (periodId, userId) => {
  await exports.buildFoto(periodId);
  const ret = await exports.summaryBox();
  const ret2 = await exports.allLines();
  const ret3 = await exports.tTContribution();
  const foto = {
    sum: ret,
    all: ret2,
    contribution: ret3,
  };

  let coll = await getMyCollaborator(userId);
  coll = coll ? coll : {};
  const summary = {
    lloguer: {},
    propi: {
      IngTotAmbInv: 0,
      IngTotNoInv: 0,
      Drops: 0,
      CapexTronc: 0,
      CapexTot: 0,
      Opex: 0,
      EstrRe: 0,
      Matllog: 0,
      SlaIngr: 0,
      IngrBono: 0,
      ServeiInet: 0,
      ServeiMob: 0,
      ServeiFix: 0,
    },
  };
  for (const r of foto.sum) {
    if (r.Col !== coll.name && coll.master != 1) {
      continue;
    }
    _.set(summary, `${r.Col}.${r.macroSup}`, r);
  }

  const allLines = [];
  for (const r of foto.all) {
    if (r.Col !== coll.name && coll.master != 1) {
      continue;
    }
    allLines.push(r);
  }

  return {
    contribution: foto.contribution,
    summary,
    allLines,
  };
};

exports.getIncomeBreakDown = async (periodId, userId) => {
  const r = await exports._getAll(periodId, userId);
  return respondSuccess(r.summary);
};

exports.getIncomeDetail = async (periodId, userId) => {
  const r = await exports._getAll(periodId, userId);
  return r.allLines;
};

exports.getTTContribution = async (periodId, userId) => {
  const r = await exports._getAll(periodId, userId);
  return r.contribution;
};

exports.downloadTTContribution = async (periodId, userId) => {
  const contribution = await exports.getTTContribution(periodId, userId);
  const workbook = new Excel.Workbook();
  workbook.creator = 'system';
  workbook.lastModifiedBy = 'system';
  workbook.created = new Date();
  workbook.modified = new Date();
  const worksheet = workbook.addWorksheet('Main');
  worksheet.columns = [
    { header: 'Col', key: 'Col', width: 5 },
    { header: 'transit1', key: 'transit1', width: 15 },
    { header: 'transport1', key: 'transport1', width: 15 },
  ];
  const rows = [{ Col: '0', transit1: '0', transport1: '0' }];
  worksheet.addRows(rows);
  return workbook;
};

exports.downloadDetails = async (periodId, userId) => {
  const incomeDetail = await exports.getIncomeDetail(periodId, userId);
  const workbook = new Excel.Workbook();
  workbook.creator = 'system';
  workbook.lastModifiedBy = 'system';
  workbook.created = new Date();
  workbook.modified = new Date();
  const worksheet = workbook.addWorksheet('Main');
  worksheet.columns = [
    { header: 'Col', key: 'Col', width: 5 },
    { header: 'clientId', key: 'clientId', width: 5 },
    { header: 'name', key: 'name', width: 15 },
    { header: 'reference', key: 'reference', width: 15 },
    { header: 'description', key: 'description', width: 15 },
    { header: 'macroSup', key: 'macroSup', width: 15 },
    { header: 'supplier', key: 'supplier', width: 15 },
    { header: 'tanper1', key: 'tanper1', width: 15 },
    { header: 'totalLinea', key: 'totalLinea', width: 15 },
    { header: 'ingTotAmbInv', key: 'ingTotAmbInv', width: 15 },
    { header: 'ingTotNoInv', key: 'ingTotNoInv', width: 15 },
    { header: 'drops', key: 'drops', width: 15 },
    { header: 'capexTronc', key: 'capexTronc', width: 15 },
    { header: 'capexTot', key: 'capexTot', width: 15 },
    { header: 'opex', key: 'opex', width: 15 },
    { header: 'EstrRe', key: 'EstrRe', width: 15 },
    { header: 'matllog', key: 'matllog', width: 15 },
    { header: 'slaIngr', key: 'slaIngr', width: 15 },
    { header: 'ingrBono', key: 'ingrBono', width: 15 },
    { header: 'ServeiInet', key: 'ServeiInet', width: 15 },
    { header: 'ServeiMob', key: 'ServeiMob', width: 15 },
    { header: 'ServeiFix', key: 'ServeiFix', width: 15 },
    { header: 'importTax', key: 'importTax', width: 15 },
  ];
  const rows = [
    {
      Col: '',
      clientId: '0',
      name: '-',
      reference: '-',
      description: '-',
      macroSup: '-',
      supplier: '-',
      tanper1: '0',
      totalLinea: '0',
      ingTotAmbInv: '0',
      ingTotNoInv: '0',
      drops: '0',
      capexTronc: '0',
      capexTot: '0',
      opex: '0',
      EstrRe: '0',
      matllog: '0',
      slaIngr: '0',
      ingrBono: '0',
      ServeiInet: '0',
      ServeiMob: '0',
      ServeiFix: '0',
      importTax: '0',
    },
  ];
  worksheet.addRows(rows);
  return workbook;
};
