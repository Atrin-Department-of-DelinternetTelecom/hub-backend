'use strict';

require('../init-tests');
const {
  createGfFeeGroup,
  getGfFeeGroups,
  getGfFeeGroupsId,
  updateGfFeeGroup,
  deleteGfFeeGroup,
  getGfFeeGroupSection,
} = require('src/api/service/intranet/GfFeeGroupService');
const {
  createGfFeeGrouplabel,
  getGfFeegroupsLabels,
  getGfFeegroupsLabelId,
  updateGfFeegroupsLabel,
  deleteGfFeegroupsLabel,
} = require('src/api/service/intranet/GfFeeGroupsLabelService');
const {
  createGfFeegroupsGroupLabel,
  getGfFeegroupsGroupLabels,
  getGfFeegroupsGroupLabelId,
  updateGfFeegroupsGroupLabel,
  deleteGfFeegroupsGroupLabel,
} = require('src/api/service/intranet/GfFeeGroupsGroupLabelService');
const {
  GfFeeGroup,
  GfFeegroupsLabel,
  GfFeegroupsGroupLabel,
  GfFeegroupsLabelsXref,
  GfFeegroupsGroupLabelsXref,
  GfFeegroupsSectionsXref,
} = require('@models').intranet;

beforeAll(async () => {
  await GfFeeGroup.destroy({
    where: {},
    truncate: true,
  });

  await GfFeegroupsLabel.destroy({
    where: {},
    truncate: true,
  });

  await GfFeegroupsGroupLabel.destroy({
    where: {},
    truncate: true,
  });

  await GfFeegroupsLabelsXref.destroy({
    where: {},
    truncate: true,
  });

  await GfFeegroupsGroupLabelsXref.destroy({
    where: {},
    truncate: true,
  });

  await GfFeegroupsSectionsXref.destroy({
    where: {},
    truncate: true,
  });
});

describe('GfFeeGroupService.createGfFeeGroup', () => {
  it('should work', async () => {
    // init context
    const body = {
      uid: 90,
      active: 1,
      name: 'test',
      internalName: 'internal test',
      description: 'test description',
      status: 1,
      labels: [1],
      grouplabels: [1],
      sectionId: 1,
    };

    const result = await createGfFeeGroup(body);
    expect(result.code).toBe(201);
    expect(typeof result.payload.data).toBe('object');
  });
});

describe('GfFeeGroupService.getGfFeeGroups', () => {
  it('should work', async () => {
    const result = await getGfFeeGroups({});
    expect(result.code).toBe(200);
  });
});

describe('GfFeeGroupService.getGfFeeGroupsId', () => {
  it('should work', async () => {
    const result = await getGfFeeGroupsId(1);
    expect(result.code).toBe(200);
  });
});

describe('GfFeeGroupService.updateGfFeeGroup', () => {
  it('should work', async () => {
    // init context
    const body = {
      uid: 90,
      active: 1,
      name: 'test',
      internalName: 'internal test',
      description: 'test description',
      status: 1,
      labels: [1],
      grouplabels: [1],
      sectionId: 1,
    };

    const result = await updateGfFeeGroup(1, body);
    expect(result.code).toBe(200);
    expect(typeof result.payload.data).toBe('object');
  });
});

describe('GfFeeGroupService.deleteGfFeeGroup', () => {
  it('should work', async () => {
    const result = await deleteGfFeeGroup(1);
    expect(result.code).toBe(200);
  });
});

describe('GfFeeGroupService.getGfFeeGroupSection', () => {
  it('should work', async () => {
    const result = await getGfFeeGroupSection(1);
    expect(result.code).toBe(200);
  });
});

describe('GfFeeGroupsLabelService.createGfFeeGrouplabel', () => {
  it('should work', async () => {
    // init context
    const body = {
      uid: 90,
      name: 'test',
      status: 1,
    };

    const result = await createGfFeeGrouplabel(body);
    expect(result.code).toBe(201);
    expect(typeof result.payload.data).toBe('object');
  });
});

describe('GfFeeGroupsLabelService.getGfFeegroupsLabels', () => {
  it('should work', async () => {
    const result = await getGfFeegroupsLabels({});
    expect(result.code).toBe(200);
  });
});

describe('GfFeeGroupsLabelService.getGfFeegroupsLabelId', () => {
  it('should work', async () => {
    const result = await getGfFeegroupsLabelId(1);
    expect(result.code).toBe(200);
  });
});

describe('GfFeeGroupsLabelService.updateGfFeegroupsLabel', () => {
  it('should work', async () => {
    // init context
    const body = {
      uid: 90,
      name: 'test',
      status: 1,
    };

    const result = await updateGfFeegroupsLabel(1, body);
    expect(result.code).toBe(200);
    expect(typeof result.payload.data).toBe('object');
  });
});

describe('GfFeeGroupsLabelService.deleteGfFeegroupsLabel', () => {
  it('should work', async () => {
    const result = await deleteGfFeegroupsLabel(1);
    expect(result.code).toBe(200);
  });
});

describe('GfFeeGroupsGroupLabelService.createGfFeegroupsGroupLabel', () => {
  it('should work', async () => {
    // init context
    const body = {
      uid: 90,
      name: 'test',
      status: 1,
    };

    const result = await createGfFeegroupsGroupLabel(body);
    expect(result.code).toBe(201);
    expect(typeof result.payload.data).toBe('object');
  });
});

describe('GfFeeGroupsGroupLabelService.getGfFeegroupsGroupLabels', () => {
  it('should work', async () => {
    const result = await getGfFeegroupsGroupLabels({});
    expect(result.code).toBe(200);
  });
});

describe('GfFeeGroupsGroupLabelService.getGfFeegroupsGroupLabelId', () => {
  it('should work', async () => {
    const result = await getGfFeegroupsGroupLabelId(1);
    expect(result.code).toBe(200);
  });
});

describe('GfFeeGroupsGroupLabelService.updateGfFeegroupsGroupLabel', () => {
  it('should work', async () => {
    // init context
    const body = {
      uid: 90,
      name: 'test',
      status: 1,
    };

    const result = await updateGfFeegroupsGroupLabel(1, body);
    expect(result.code).toBe(200);
    expect(typeof result.payload.data).toBe('object');
  });
});

describe('GfFeeGroupsGroupLabelService.deleteGfFeegroupsGroupLabel', () => {
  it('should work', async () => {
    const result = await deleteGfFeegroupsGroupLabel(1);
    expect(result.code).toBe(200);
  });
});
