import { cubicInterpolationBezier, cubicInterpolationBezierFirstDerivative } from "./math";
import {addCustomStyle} from './domUtils';

function setupSandboxCurves() {

	const sandboxDiv = document.createElement('div');
	sandboxDiv.id = 'curve-sandbox';
	addCustomStyle({
		id:'curve-sandbox',
		content:'position: absolute; right: 2em; top: 2em; display: flex; flex-direction: column;'
	});

	const svg  = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGSVGElement;
	sandboxDiv.appendChild(svg);
	svg.id = 'curve-svg';
	svg.setAttribute("viewBox", "0 0 100 100");

	addCustomStyle({
		id:'curve-svg',
		content: 'width: 30em; height: 30em; background-color: #cccccc88;',
	});

	const inputClassName = addCustomStyle({
		className: 'curve-input',
		content: 'display: flex; flex-direction: row; width: 30em; color: white; height: 2em; align-items: center;'
	});

	function createSliderInput(name : string, onChange : (value : number)=>any) {
		const inputRoot = document.createElement('div');
		inputRoot.className = inputClassName;
		const input = document.createElement('input');
		input.type = 'range';
		input.min = '0';
		input.max = '1000';
		inputRoot.appendChild(input);
		inputRoot.id = name;

		const label = document.createElement('p');
		inputRoot.appendChild(label);

		input.addEventListener('input', (event)=>{
			const target = event.target as HTMLInputElement;
			const value = Number(target.value) / 1000;
			label.textContent = value.toString();
			onChange(value);
		});

		return inputRoot;
	}


	const curveLine = document.createElementNS("http://www.w3.org/2000/svg", "polyline") as SVGPolylineElement;
	svg.appendChild(curveLine);
	curveLine.style.stroke = "white";
	curveLine.style.fill = "transparent";
	curveLine.style.strokeWidth = "1px";
	
	
	const speedLine = document.createElementNS("http://www.w3.org/2000/svg", "polyline") as SVGPolylineElement;
	svg.appendChild(speedLine);
	speedLine.style.stroke = "yellow";
	speedLine.style.fill = "transparent";
	speedLine.style.strokeWidth = "1px";
	
	const p1 = {x: 0.98, y: 0.86};
	const p2 = {x: 0.61, y: 1.};
	
	function renderCurve() {
		curveLine.points.clear();
		speedLine.points.clear();
		const nbIteration = 50;
		for (let i = 0; i < (nbIteration + 1); ++i)
		{
			const t = i / nbIteration;
			const p = cubicInterpolationBezier(t , p1, p2);
			
			const point = svg.createSVGPoint();
			point.x = p.x * 100;
			point.y = 100 - p.y * 100;
			curveLine.points.appendItem(point);
			
			const speed = cubicInterpolationBezierFirstDerivative(t, p1, p2);
			const speedPoint = svg.createSVGPoint();
			speedPoint.x = t * 100;
			speedPoint.y = 100 - speed.y * 100;
			speedLine.points.appendItem(speedPoint);
		}
	}
	
	const p1x = createSliderInput('p1x', (value)=>{
		p1.x = Number(value);
		renderCurve();
	});

	sandboxDiv.appendChild(p1x);
	
	const p1y = createSliderInput('p1y', (value)=>{
		p1.y = Number(value);
		renderCurve();
	});

	sandboxDiv.appendChild(p1y);
	
	const p2x = createSliderInput('p2x', (value)=>{
		p2.x = Number(value);
		renderCurve();
	});

	sandboxDiv.appendChild(p2x);
	
	const p2y = createSliderInput('p2y', (value)=>{
		p2.y = Number(value);
		renderCurve();
	});

	sandboxDiv.appendChild(p2y);

	renderCurve();

	const targetParent = document.getElementById('game-board');
	targetParent?.appendChild(sandboxDiv);
}

export { setupSandboxCurves };