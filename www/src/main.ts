import {Vec2, Vec3} from './vec.js';
import {ICardElements, ICardPresentationOptions, addCardPresentationCapability} from './cardTool.js';

interface IContainer extends HTMLElement {
	isDragging : boolean;
}

const container = document.getElementById('container')! as IContainer;
const card = document.getElementById('card')!;
const cardItem = document.getElementById('card-item')!;
const shine = document.getElementById('shine')!;
const shade = document.getElementById('unshine')!;

interface IBoundingRect {
	top : number,
	right : number,
	bottom : number,
	left : number,

	width : number,
	height : number,
	
	centerX : number,
	centerY : number,
}

function getElementCoord(elem : HTMLElement) : IBoundingRect{
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

var containerRect = getElementCoord(container)!;

const cardElements : ICardElements = {
	root : card,
	cardItem : cardItem,
	shine : shine,
	shade : shade,
};

const cardOptions : ICardPresentationOptions = {
	lightDirection : (new Vec3(.15, -1, .25)).normalize(),
	simHeight : 190, 
	lightPower : 1.5,
	shadowDistance : 5
};

const presentationCard = addCardPresentationCapability(cardElements, cardOptions);

container.isDragging = false;

function startMove() {
	presentationCard.setZoom(2);
	
	presentationCard.setSmoothOrientation(false);
	
	container.isDragging = true;
}

function endMove() {
	if (container.isDragging) {
		presentationCard.setZoom(1);
		
		presentationCard.setSmoothOrientation(true);
		
		presentationCard.setOrientation(Vec2.Zero);
		container.isDragging = false;
	}
}

container.addEventListener('mousedown', (ev)=>{
	startMove();
});

container.addEventListener('mouseup', (ev)=>{
	endMove();
});

container.addEventListener('pointerleave', (ev)=> {
	endMove();
});

container.addEventListener('mousemove', (ev)=> {
	if (container.isDragging) {
		const target = ev.target! as HTMLElement;
		const targetRect = getElementCoord(target);
		const evPosition = new Vec2(ev.clientX - targetRect.centerX, ev.clientY - targetRect.centerY);
		presentationCard.setOrientation(evPosition);
	}
});

container.addEventListener("touchstart", (ev)=>{
	startMove();
}, false);

container.addEventListener("touchcancel", (ev)=>{
	endMove();
}, false);

container.addEventListener("touchend", (ev)=>{
	endMove();
}, false);

container.addEventListener('touchmove',(ev)=>{
	ev.preventDefault();
	if(container.isDragging)
	{
		const target = ev.target! as HTMLElement;
		const targetRect = getElementCoord(target);

		const evPosition = new Vec2(ev.touches[0].clientX - targetRect.centerX, ev.touches[0].clientY - targetRect.centerY);
		presentationCard.setOrientation(evPosition);
	}
});

presentationCard.setOrientation(Vec2.Zero);