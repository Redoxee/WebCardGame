import { cubicInterpolationBezier, cubicInterpolationBezierFirstDerivative } from "./math";


function getAndSetupRangeInput(id : string, action : (event : Event)=>any) {
	const root = document.getElementById(id)!;
	const input = root.getElementsByTagName('input')[0];
	const label = root.getElementsByTagName('p')[0];
	input.addEventListener('input', (event)=> {    
		let target = event.target as HTMLInputElement;
		label.textContent = target.value;
		action(event);
	});
}

function setupSandboxCurves() {

	const svg = document.getElementById('curve-svg') as any as SVGSVGElement;
	const curveLine = document.createElementNS("http://www.w3.org/2000/svg", "polyline") as SVGPolylineElement;
	svg.appendChild(curveLine);
	curveLine.style.stroke = "white";
	curveLine.style.fill = "transparent";
	curveLine.style.strokeWidth = "2px";
	
	
	const speedLine = document.createElementNS("http://www.w3.org/2000/svg", "polyline") as SVGPolylineElement;
	svg.appendChild(speedLine);
	speedLine.style.stroke = "yellow";
	speedLine.style.fill = "transparent";
	speedLine.style.strokeWidth = "2px";
	
	const p1 = {x: 0.98, y: 0.86};
	const p2 = {x: 0.61, y: 1.};
	
	function renderCurve() {
		curveLine.points.clear();
		speedLine.points.clear();
		const nbIteration = 50;
		console.log('refresh');
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
	
	getAndSetupRangeInput('p1x', (event)=>{
		const target = event.target as HTMLInputElement;
		p1.x = Number(target.value) / 1000;
		renderCurve();
	});

	getAndSetupRangeInput('p1y', (event)=>{
		const target = event.target as HTMLInputElement;
		p1.y = Number(target.value) / 1000;
		renderCurve();
	});

	getAndSetupRangeInput('p2x', (event)=>{
		const target = event.target as HTMLInputElement;
		p2.x = Number(target.value) / 1000;
		renderCurve();
	});

	getAndSetupRangeInput('p2y', (event)=>{
		const target = event.target as HTMLInputElement;
		p2.y = Number(target.value) / 1000;
		renderCurve();
	});
}

export { setupSandboxCurves };