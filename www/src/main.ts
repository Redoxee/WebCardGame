import {Vec2, Vec3} from './framework/vec';
import {ICardPresentationOptions, addCardPresentationCapability, ICardPresentation} from './framework/cardPresentation';
import {setupSandboxCurves} from './curveSandbox';
import {uniqueId ,addCustomStyle, BoundingRect} from './framework/domUtils';
import { cubicInterpolationBezier, cubicInterpolationBezierFirstDerivative, BezierPreset, IBezierParams } from './framework/mathUtils';
import { ICardCollection, setupCardCollection, SelectClosestItemSelector, ICardCollectionParameters, ICollectionEventDetails, ReservationResult, setupDeckCollection } from './framework/cardCollection';

function runMain() {
	const draggedZindex = 100;
	const displayedCardItemParams : ICardCollectionParameters = {
		itemStyle : "width : 5em; height: 5em",
	};
	
	let hoveredCardCollection : ICardCollection|null = null;
	const allCardCollections : ICardCollection[] = [];
	
	const board = document.getElementById('game-board')!;
	const mockCard = document.getElementById('mock-card')!;
	mockCard.parentNode!.removeChild(mockCard);

	const sfxFlip = Array.from(document.getElementsByClassName('flip-sfx')).map(e=>e as HTMLAudioElement);
	
	const shopDeck = setupDeckCollection(document.getElementById('shop-deck')!, {});
	const shopBoard = setupCardCollection(document.getElementById('shop')!, {});
	const playedCards = setupCardCollection(document.getElementById('played-cards')!, displayedCardItemParams);
	const playerDeck = setupDeckCollection(document.getElementById('player-deck')!, {});
	const playerHand = setupCardCollection(document.getElementById('player-hand')!, displayedCardItemParams);
	const playerDiscard = setupDeckCollection(document.getElementById('player-discard')!, {});

	function makeCard() : ICardPresentation {
		const rootNode = mockCard.cloneNode(true) as HTMLElement;
		document.body.appendChild(rootNode);

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

	let draggedObject : ICardPresentation | null = null;

	function startInput(card : ICardPresentation) {
		draggedObject = card;
		if (hoveredCardCollection && hoveredCardCollection.ContainsCard(card)) {
			hoveredCardCollection.DetachCard(card);
			hoveredCardCollection.ReserveSlot(SelectClosestItemSelector(card.currentPosition.x, card.currentPosition.y));
		}

		card.style.zIndex = draggedZindex.toString();
		card.SetSmoothOrientation(false);
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
			console.log('hello');
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
		
		card.lerpAnimator.StartAnimation({
			p0: start,
			p1: end,
			speed : lerpedSpeed,
			bezierParams : BezierPreset.Linear,
			rotationFactor : 100
		});
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
		for (let index = 0; index < 15; ++index) {
			const shopCard = makeCard();
			document.body.appendChild(shopCard);
			shopCard.SetFlip(true);
			shopDeck.InsertCardInstant(shopCard, 0);
		}

		shopDeck.addEventListener('click', _=> {
			shopDeck.SlideAllCardsToAssignedItems();
			if (shopDeck.itemInUse.length > 0) {
				const card = shopDeck.PopCard()!;
				shopBoard.ReserveSlot(()=>shopBoard.itemInUse.length - 1);
				shopBoard.AssignCardToReservation(card);
				card.AnimatedFlip(false);
				
				card.addEventListener('click', _=> {
					console.log(card.isZoomed);
					if (!card.isZoomed) {
						card.SetZoom(2.5);
					} else {
						card.SetZoom(1);
					}
				});
			}
		});
	}
	
	{
		for (let index = 0; index  < 15; ++index) {
			const card = makeCard();
			playerDeck.InsertCardInstant(card, 0);
			card.SetFlip(true);
		}

		playerDeck.addEventListener('click', ()=>{
			const handSize = 7;
			if (playerDeck.itemInUse.length < handSize) {
				for (let index = playerDiscard.itemInUse.length - 1; index >= 0; --index) {
					const card = playerDiscard.PopCard()!;
					playerDeck.ReserveSlot(()=>0);
					playerDeck.AssignCardToReservation(card);
					card.AnimatedFlip(true);
				}
			}

			if (playerHand.itemInUse.length > handSize || playerDeck.itemInUse.length < 1) {
				return;
			}
			
			const counter = Math.min(handSize - playerHand.itemInUse.length, playerDeck.itemInUse.length);
			for (let index = 0; index < counter; ++index) {
				const card = playerDeck.PopCard() as ICardPresentation;
				playerHand.ReserveSlot(()=>playerHand.itemInUse.length - 1);
				playerHand.AssignCardToReservation(card);
				card.AnimatedFlip(false);
			}
		});
	}

	{
		for (let index = 0; index < 1; ++index) {
			const card = makeCard();
			playerDiscard.InsertCardInstant(card, 0);
		}
	}
	
	{
		for (let index = 0; index < playerHand.itemPool.length; ++index) {
			const item = playerHand.itemPool[index];
			item.addEventListener('click',()=>{
				const card = item.assignedCard!;
				playerHand.DetachCard(card);

				playedCards.ReserveSlot(()=>playedCards.itemInUse.length - 1);
				playedCards.AssignCardToReservation(card);
			});
		}
	}

	{
		document.getElementById('end-turn-button')?.addEventListener('click',_=>{
			for (let index = playedCards.itemInUse.length - 1; index >= 0 ; --index) {
				const card = playedCards.itemInUse[index].assignedCard!;

				playedCards.DetachCard(card);
				playerDiscard.ReserveSlot(()=>playerDiscard.itemInUse.length - 1);
				playerDiscard.AssignCardToReservation(card);
			}
		});
	}
}

window.addEventListener('load', ()=>{
	runMain();
});