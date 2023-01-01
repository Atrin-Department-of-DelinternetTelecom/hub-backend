'use strict';

module.exports = {
  // OVCSW (callejero / RC lookup) – still valid
  baseUrl:
    'https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejeroCodigos.asmx/',

  // INSPIRE ATOM feeds – moved off minhap → hacienda
  atom: {
    // Cadastral Parcels
    cp: 'https://www.catastro.hacienda.gob.es/INSPIRE/CadastralParcels/ES.SDGC.CP.atom.xml',
    // Addresses
    ad: 'https://www.catastro.hacienda.gob.es/INSPIRE/Addresses/ES.SDGC.AD.atom.xml',
    // Buildings
    bu: 'https://www.catastro.hacienda.gob.es/INSPIRE/buildings/ES.SDGC.BU.atom.xml',

    // Base for ZIP items referenced by the AD feed
    ZipBase: 'https://www.catastro.hacienda.gob.es/INSPIRE/addresses/',
    zipSeed: 'A.ES.SDGC.AD.',
  },

  code: {
    province: 'ConsultaProvincia',
    city: 'ConsultaMunicipioCodigos',
    street: 'ConsultaViaCodigos',
    building: 'Consulta_DNPLOC_Codigos',
    number: 'ConsultaNumeroCodigos',
    cadastre: 'Consulta_DNPRC_Codigos',
  },

  // safer: guard against undefined env
  restrict: String(process.env.GEO_PROVINCES_RESTRICT || '').toLowerCase(),
};
