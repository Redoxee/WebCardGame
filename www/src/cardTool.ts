import {Vec2, Vec3} from './vec.js';
import {addCustomStyle} from './domUtils';

function rotatePitchRoll(vec : Vec3, pitch : number, roll : number) {
	const cp = Math.cos(pitch);
	const sp = Math.sin(pitch);
	const cr = Math.cos(roll);
	const sr = Math.sin(roll);
	
	return new Vec3(vec.x * cp + vec.z * sp, vec.x * sp * sr + vec.y * cr - vec.z * sr * cp, -vec.x * sp * cr + vec.y * sr + vec.z * cp * cr);
}

interface ICardElements {
	root : HTMLElement,
	cardItem : HTMLElement,
	shine : HTMLElement,
	shade : HTMLElement
}

interface ICardPresentationOptions {
	simHeight : number;
	lightDirection : Vec3;
	lightPower : number;
	shadowDistance : number;
}

interface ICardPresentation extends HTMLElement {
	setOrientation(position : Vec2) : void;
	setZoom(zoom : number) : void;
	setSmoothOrientation(enabled : boolean) : void;
}

function addCardPresentationCapability(cardElements : ICardElements, options : ICardPresentationOptions) : ICardPresentation{
	const card = cardElements.root as ICardPresentation;

	const shadowOffset = {
		x : options.shadowDistance * Vec3.dot(options.lightDirection, Vec3.Left), 
		y : options.shadowDistance * Vec3.dot(options.lightDirection, Vec3.Down)
	};

	cardElements.cardItem.style.filter = `drop-shadow(${shadowOffset.x}px ${shadowOffset.y}px 5px black)`;
	
	const shadeDirection = new Vec3(-options.lightDirection.x, -options.lightDirection.y, options.lightDirection.z);
	
	card.setOrientation = (position : Vec2) => {
		const atanX = Math.atan2(Math.abs(position.x), options.simHeight);
		const angleX = position.x === 0 ? 0 : position.x > 0 ? atanX : -atanX;
		const atanY = Math.atan2(Math.abs(position.y), options.simHeight);
		const angleY = position.y === 0 ? 0 : position.y > 0 ? -atanY : atanY;
	
		// Rotating a vector up toward the viewer to the inclination of the card.
		const normal = rotatePitchRoll(Vec3.Backward, angleX, angleY);
		const li = Math.pow(Vec3.dot(normal, options.lightDirection), options.lightPower);
	
		cardElements.cardItem.style.transform = `rotateY(${angleX}rad) rotateX(${angleY}rad)`;
		cardElements.shine.style.opacity = `${li * 100}%`;
		
		const unLi = Math.pow(Vec3.dot(normal, shadeDirection), options.lightPower);
		cardElements.shade.style.opacity = `${unLi * 100}%`;
	}

	const smoothTransition = addCustomStyle({
		className:"zoomin",
		content: "transition: transform 0.25s ease-out;"
	});

	card.classList.add(smoothTransition);
	card.setZoom = (zoom) => {
		card.style.transform = `scale(${zoom})`;
	};

	card.setSmoothOrientation = (enabled) => {
		if (enabled) {
			if(!cardElements.cardItem.classList.contains(smoothTransition)) {
				cardElements.cardItem.classList.add(smoothTransition);
			}
		}
		else {
			if(cardElements.cardItem.classList.contains(smoothTransition)) {
				cardElements.cardItem.classList.remove(smoothTransition);
			}
		}
	}

	return card;
}

export {addCardPresentationCapability, ICardElements, ICardPresentation, ICardPresentationOptions};