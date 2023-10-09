import { v4 as uuid } from 'uuid';
function addCustomStyle(customStyle) {
    const className = `${customStyle.className}-${uuid()}`;
    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `${customStyle.className ? `.${className}` : ''} ${customStyle.id ? `#${customStyle.id}` : ''} { ${customStyle.content} }`;
    document.getElementsByTagName('head')[0].appendChild(style);
    return className;
}
function getElementBounds(elem) {
    let box = elem.getBoundingClientRect();
    return {
        top: box.top + window.pageYOffset,
        right: box.right + window.pageXOffset,
        bottom: box.bottom + window.pageYOffset,
        left: box.left + window.pageXOffset,
        centerX: box.left + window.pageXOffset + (box.right - box.left) / 2,
        centerY: box.top + window.pageYOffset + (box.bottom - box.top) / 2,
        width: box.right - box.left,
        height: box.top - box.bottom,
    };
}
export { addCustomStyle, getElementBounds };
