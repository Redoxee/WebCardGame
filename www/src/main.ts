import {Vec2, Vec3} from './vec';
import {ICardPresentationOptions, addCardPresentationCapability, ICardPresentation} from './cardTool';
import {setupSandboxCurves} from './curveSandbox';
import {uniqueId ,addCustomStyle, BoundingRect} from './domUtils';
import { cubicInterpolationBezier, cubicInterpolationBezierFirstDerivative, BezierPreset, IBezierParams } from './math';
import { ICardCollection, setupCardCollection, SelectClosestItemSelector, ICardCollectionParameters, ICollectionEventDetails, ReservationResult, setupDeckCollection } from './cardCollectionTool';

function runMain() {

	const board = document.getElementById('game-board')!;
	const container = document.getElementById('card-root')!;

	let hoveredCardCollection : ICardCollection|null = null;
	
	const sfxFlip = Array.from(document.getElementsByClassName('flip-sfx')).map(e=>e as HTMLAudioElement);

	const draggedZindex = 100;

	function makeCard(rootNode : HTMLElement) : ICardPresentation {
		const cardClassName = `PresentationCard${uniqueId()}`;
		rootNode.classList.add(cardClassName);

		const cardOptions : ICardPresentationOptions = {
			lightDirection : (new Vec3(.15, -1, .25)).normalize(),
			simHeight : 190, 
			lightPower : 1.5,
			shadowDistance : 5
		};
		
		const presentationCard = addCardPresentationCapability(rootNode, cardOptions);
		presentationCard.LookToward(Vec2.Zero);
		return presentationCard;
	}

	const debugCard = makeCard(container);

	let draggedObject : ICardPresentation | null = null;

	function startInput(card : ICardPresentation) {
		draggedObject = card;
		if (hoveredCardCollection && hoveredCardCollection.ContainsCard(card)) {
			hoveredCardCollection.DetachCard(card);
			hoveredCardCollection.ReserveSlot(SelectClosestItemSelector(card.currentPosition.x, card.currentPosition.y));
		}

		card.style.zIndex = draggedZindex.toString();
		debugCard.SetSmoothOrientation(false);
	}

	function endInput() {
		if (draggedObject) {
			draggedObject.style.zIndex = (draggedZindex - 1).toString();
			if (hoveredCardCollection) {
				hoveredCardCollection.AssignCardToReservation(draggedObject);
			}
			
			draggedObject = null;
		}
	}

	function setupCardInput(targetCard : ICardPresentation) {
		targetCard.root.addEventListener('mousedown', (_)=>{
			startInput(targetCard);
		});
		
		targetCard.root.addEventListener("touchstart", (ev)=>{
			const target = ev.target as ICardPresentation;
			startInput(target);
		}, false);
		
		targetCard.root.addEventListener("touchcancel", (ev)=>{
			endInput();
		}, false);
		
		targetCard.root.addEventListener("touchend", (ev)=>{
			endInput();
		}, false);
	}

	setupCardInput(debugCard);

	function DetachCardFromAnyCollection(card: ICardPresentation) {
		allCardCollections.forEach(collection=>{
			if(collection.ContainsCard(card)) {
				collection.DetachCard(card);
			}
		});
	}

	function playRandomFlipSfx() {
		const index = Math.floor(Math.random() * sfxFlip.length);
		sfxFlip[index].play();
	}

	const testButton = document.getElementById('slide-button') as HTMLButtonElement;
	
	const targets = document.getElementById('slide-test')!.getElementsByClassName('target');

	let currentIndex = 0;

	testButton.addEventListener('click', (_ev)=>{
		currentIndex = (currentIndex + 1) % targets.length;
		const targetPosition = new BoundingRect(targets.item(currentIndex) as HTMLElement);
		DetachCardFromAnyCollection(debugCard);
		debugCard.lerpAnimator.StartAnimation(
			debugCard.currentPosition,
			targetPosition.centerPosition,
			.65,
			BezierPreset.EaseInOut
			);
	});
		
	function boardMove(card : ICardPresentation,posX : number, posY : number) {
		const startPosition = new BoundingRect(card.root);
		const start = startPosition.centerPosition;
		const end = new Vec2(posX, posY);
		
		const travelLength = Vec2.sub(end, start).length();
		
		const lerpLowerBound = 45;
		const lerpUpperBound = 180;
		const minSpeed = .8;
		const maxSpeed = 2.7;
		
		// Computing the distance versus the lower upper bound (if distance is low keep the low speed, speedup as distance is high)
		let lp = (travelLength - lerpLowerBound) / (lerpUpperBound - lerpLowerBound);
		
		// clamping between 0 and 1
		if (lp < 0) {
			lp = 0;
		} else if (lp > 1) {
			lp = 1;
		}
		
		// Applying a ramp
		lp = lp * lp;
		// converting to speed
		const lerpedSpeed = (maxSpeed - minSpeed) * lp + minSpeed;
		
		card.lerpAnimator.StartAnimation(
			start,
			end,
			lerpedSpeed,
			BezierPreset.Linear);
	}
		
	board.addEventListener('mousemove', (event) => {
		if(draggedObject) {
			boardMove(draggedObject, event.clientX , event.clientY);
		}
	});

	board.addEventListener('touchmove', (event)=>{
		if(draggedObject) {
			const target = event.targetTouches[0];
			boardMove(draggedObject, target.clientX, target.clientY - 150);
		}
	});

	board.addEventListener('mouseup', ()=>{
		endInput();
	});

	const testCards : ICardPresentation[] = [];
	for (let index = 0; index < 10; ++index){
		const element = debugCard.cloneNode(true) as HTMLElement;
		board.appendChild(element);
		const testCard = makeCard(element);
		testCard.lerpAnimator.StartAnimation(testCard.currentPosition, 
			Vec2.add(testCard.currentPosition, new Vec2(index  * 30, 0)),
			.5,
			BezierPreset.EaseInOut);
			setupCardInput(testCard);
			testCards.push(testCard);
	}
	
	const cardCollectionParams : ICardCollectionParameters = {
		itemStyle : "width : 5em; height: 5em",
	};
	
	const allCardCollections : ICardCollection[] = [];
	const allCardCollectionElements = document.getElementsByClassName('card-collection');
	for(let index = 0; index < allCardCollectionElements.length; ++index) {
		const element = allCardCollectionElements.item(index) as HTMLElement;
		allCardCollections.push(setupCardCollection(element, cardCollectionParams));
	}
	
	board.addEventListener('mousemove', (ev)=> {
		const mousePosition = new Vec2(ev.clientX, ev.clientY);
		
		let currentHoveredCollection : ICardCollection|null = null;
		for(let index = 0; index < allCardCollections.length; ++index){
			const collection = allCardCollections[index];
			if(collection.bounds.Contains(mousePosition)) {
				currentHoveredCollection = collection;
				break;
			}
		}

		if (currentHoveredCollection !== hoveredCardCollection) {
			if (hoveredCardCollection && hoveredCardCollection.reservingItem) {
				hoveredCardCollection.CancelReservation();
				playRandomFlipSfx();
			}
			
			hoveredCardCollection = currentHoveredCollection;
		}

		if (currentHoveredCollection && draggedObject) {
			const reservationResult = currentHoveredCollection.ReserveSlot(SelectClosestItemSelector(ev.clientX, ev.clientY));
			if (reservationResult === ReservationResult.New) {
				playRandomFlipSfx();
			}
		}
	});
	
	{
		const cardCollectionElement = document.getElementById('mock-collection')!;
		const cardCollection = cardCollectionElement as ICardCollection;
		testCards.forEach((el)=> {
			cardCollection.PushCardInstant(el);
		});
	}

	{
		const flipCollection = document.getElementById('flip-collection') as ICardCollection;
		document.getElementById('flip-button')?.addEventListener('click', ev=>{
			flipCollection.itemInUse.forEach(item=>{
				if (item.assignedCard) {
					item.assignedCard.AnimatedFlip(!item.assignedCard.isFlipped);
					playRandomFlipSfx();
				}
			});
		});
	}

	{
		const zoomCollection = document.getElementById('zoom-collection') as ICardCollection;
		let zoomedCard : ICardPresentation[] = [];
		document.getElementById('zoom-button')?.addEventListener('click', ev=>{
			zoomCollection.itemInUse.forEach(item=>{
				if (item.assignedCard) {
					item.assignedCard.SetZoom(2);
					zoomedCard.push(item.assignedCard);
				}
			});
		});

		zoomCollection.addEventListener('card-detach', (ev) => {
			ev.detail.card.SetZoom(1);
			zoomedCard.splice(zoomedCard.findIndex(e=>e.id === ev.detail.card.id), 1);
		});

		board.addEventListener('mousemove', ev=>{
			if(!zoomedCard) {
				return;
			}

			zoomedCard.forEach(card => {
				const delatDirection = Vec2.sub(new Vec2(ev.clientX, ev.clientY), card.currentPosition).scale(.5);
				card.LookToward(delatDirection);
			});
		});
	}

	{	
		const shuffleCollectionElement = document.getElementById('shuffle-collection') as HTMLElement;
		const shuffleCollection = setupDeckCollection(shuffleCollectionElement, {});
		allCardCollections.push(shuffleCollection);
		document.getElementById('shuffle-button')?.addEventListener('click', _=>{
			shuffleCollection.ShuffleAnimation();
		});
	}
}

window.addEventListener('load', ()=>{
	runMain();
});