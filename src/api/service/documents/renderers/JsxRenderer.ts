import { convertHtml2Package } from '../WkToPdfService';
import { Renderer } from './Renderer';
import Nano, { h, Helmet } from 'nano-jsx';
import crypto from 'crypto';

export abstract class JsxRenderer extends Renderer {
  abstract render(): JSX.IntrinsicElements;

  onlyUpload = false;

  /**
   * implementation of abstract method
   */
  getRendered() {
    const html = this.getHtml();
    return convertHtml2Package(html);
  }

  async getRenderHash(): Promise<string> {
    const html = this.getHtml();
    return crypto.createHash('md5').update(html).digest('hex');
  }

  getHtml(): string {
    const app = Nano.renderSSR(() => this.render());
    const rendered = Helmet.SSR(app);
    return rendered.body;
  }
}
