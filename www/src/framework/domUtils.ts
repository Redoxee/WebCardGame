import { Vec2 } from './vec';

let nextUniqueId = 1;
function uniqueId() {
    const id = `id-${nextUniqueId.toString(16)}`;
    nextUniqueId += 1;
    return id;
}

interface ICustomDynamicStyle {
	className? : string,
	id? : string,
	content: string
}

function addCustomStyle(customStyle : ICustomDynamicStyle) : string {
	const className = `${customStyle.className}-${uniqueId()}`;
	var style = document.createElement('style');
	style.type = 'text/css';
	style.innerHTML = `${customStyle.className?`.${className}` : ''} ${customStyle.id?`#${customStyle.id}` : ''} { ${customStyle.content} }`;
	document.getElementsByTagName('head')[0].appendChild(style);
	 return className;
}

class BoundingRect {
	targetElement : HTMLElement;
	top : number;
	right : number;
	bottom : number;
	left : number;

	width : number;
	height : number;
	
	centerPosition : Vec2;

	constructor(targetElement : HTMLElement) {
		let box = targetElement.getBoundingClientRect();
		this.targetElement = targetElement;
		this.top = box.top + window.pageYOffset;
		this.right = box.right + window.pageXOffset;
		this.bottom = box.bottom + window.pageYOffset;
		this.left = box.left + window.pageXOffset;
		this.centerPosition = new Vec2(
			box.left + window.pageXOffset + (box.right - box.left) / 2,
			box.top + window.pageYOffset + (box.bottom - box.top) / 2
		);

		this.width = box.right - box.left;
		this.height = box.top - box.bottom;
	}

	Recompute() {
		let box = this.targetElement.getBoundingClientRect();
		this.top = box.top + window.pageYOffset;
		this.right = box.right + window.pageXOffset;
		this.bottom = box.bottom + window.pageYOffset;
		this.left = box.left + window.pageXOffset;
		this.centerPosition.x = box.left + window.pageXOffset + (box.right - box.left) / 2;
		this.centerPosition.y = box.top + window.pageYOffset + (box.bottom - box.top) / 2;
		this.width = box.right - box.left;
		this.height = box.top - box.bottom;
	}

	Contains(position : Vec2) : boolean {
		return position.x > this.left && position.x < this.right && position.y > this.top && position.y < this.bottom;

	}
}

export {uniqueId ,ICustomDynamicStyle , addCustomStyle, BoundingRect};