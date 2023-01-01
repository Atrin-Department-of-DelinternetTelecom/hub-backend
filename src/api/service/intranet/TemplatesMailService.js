'use strict';

const { MoozaicGlobalBusiness, MoozaicUser } = require('@models').moozaic;
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const config = require('@config');
const templates = config.get('index.templates');

exports.TemplatesMail = class TemplatesMail {
  async init(userId, app, forcedLang = null) {
    this.business = (await MoozaicGlobalBusiness.findOne()).get({
      plain: true,
    });
    this.lang = forcedLang;
    await this.setUser(userId);
  }

  async setUser(userId) {
    const user = await MoozaicUser.findByPk(userId);
    if (!user)
      throw new Error(`User not found SendMailsManager::setUser (${userId})`);
    if (!this.lang) this.lang = user.language;
    this.user = user;
  }

  async getBody(template, info) {
    if (!fs.existsSync(path.resolve(templates, 'email', `${template}.ejs`)))
      throw new Error('template not exist');

    info.businessName = this.business.name;
    info.businessAddress = this.business.address;
    info.businessWeb = this.business.web;
    info.title = info.title ? info.title : '';
    const body = await ejs.renderFile(
      path.resolve(`${templates}/email`, 'basic.ejs'),
      info,
    );
    return body;
  }
};
