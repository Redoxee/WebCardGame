import { v4 as uuid } from 'uuid';
function addCustomStyle(customStyle) {
    const className = `${customStyle.className}-${uuid()}`;
    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `.${className} { ${customStyle.content} }`;
    document.getElementsByTagName('head')[0].appendChild(style);
    return className;
}
export { addCustomStyle };
