// Tabs functionality
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const tabId = tab.getAttribute('data-tab');

        // Update active tab
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Show active content
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(`${tabId}-tab`).classList.add('active');
    });
});

// Network visualization
function initializeNetwork(sampleId = null) {
    // Create base node structure
    const baseNodes = [
        {id: 1, label: 'Substation', shape: 'square', size: 20},
        {id: 2, label: 'N1'},
        {id: 3, label: 'N2'},
        {id: 4, label: 'N3'},
        {id: 5, label: 'N4'},
        {id: 6, label: 'N5'},
        {id: 7, label: 'N6'},
        {id: 8, label: 'N7'},
        {id: 9, label: 'N8'},
        {id: 10, label: 'N9'},
        {id: 11, label: 'N10'},
        {id: 12, label: 'N11'},
        {id: 13, label: 'N12'},
        {id: 14, label: 'N13'}
    ];

    // Default voltage values
    let voltageValues = [1.03, 1.02, 1.014, 1.01, 1.003, 0.995, 0.988, 0.982, 0.976, 0.977, 1.005, 1.0, 0.992, 0.97];

    // Update voltage values based on sample
    if (sampleId === 'ieee13') {
        voltageValues = [1.05, 1.04, 1.02, 0.99, 0.97, 0.96, 0.95, 0.94, 0.938, 0.96, 1.01, 0.98, 0.96, 0.94];
    } else if (sampleId === 'pv_impact') {
        voltageValues = [1.03, 1.035, 1.04, 1.042, 1.045, 1.048, 1.05, 1.052, 1.038, 1.047, 1.025, 1.03, 1.048, 1.038];
    } else if (sampleId === 'urban_network') {
        voltageValues = [1.02, 1.01, 1.005, 0.998, 0.989, 0.982, 0.975, 0.968, 0.962, 0.97, 0.995, 0.988, 0.98, 0.975];
    }

    // Apply voltage values to nodes and color code them
    const nodes = baseNodes.map((node, index) => {
        if (index === 0) return node; // Skip substation

        const voltage = voltageValues[index - 1];
        let color;

        if (voltage > 1.05) {
            color = {background: '#f44336', border: '#d32f2f'}; // Red for high voltage
        } else if (voltage < 0.95) {
            color = {background: '#f44336', border: '#d32f2f'}; // Red for low voltage
        } else if (voltage > 1.03 || voltage < 0.97) {
            color = {background: '#ffeb3b', border: '#fbc02d'}; // Yellow for warning
        } else {
            color = {background: '#4caf50', border: '#2e7d32'}; // Green for normal
        }

        return {
            ...node,
            title: `${node.label}: ${voltage.toFixed(3)} pu`,
            color: color
        };
    });

    // Create edges
    const baseEdges = [
        {from: 1, to: 2, width: 3},
        {from: 2, to: 3, width: 3},
        {from: 3, to: 4, width: 3},
        {from: 4, to: 5, width: 3},
        {from: 5, to: 6, width: 3},
        {from: 6, to: 7, width: 2},
        {from: 7, to: 8, width: 2},
        {from: 8, to: 9, width: 1},
        {from: 5, to: 10, width: 2},
        {from: 3, to: 11, width: 2},
        {from: 11, to: 12, width: 2},
        {from: 12, to: 13, width: 1},
        {from: 13, to: 14, width: 1}
    ];

    // Add loading indicators to edges
    const edges = baseEdges.map(edge => {
        // Calculate load level based on voltage difference
        const fromIndex = edge.from - 1;
        const toIndex = edge.to - 1;
        const v1 = fromIndex >= 0 ? voltageValues[fromIndex] : 1.05;
        const v2 = toIndex >= 0 ? voltageValues[toIndex] : 1.0;
        const voltageDiff = Math.abs(v1 - v2);

        // Determine loading color
        let color;
        if (voltageDiff > 0.02) {
            color = '#d32f2f'; // Heavy load (red)
        } else if (voltageDiff > 0.01) {
            color = '#fbc02d'; // Medium load (yellow)
        } else {
            color = '#2e7d32'; // Light load (green)
        }

        return {
            ...edge,
            color: {color: color},
            title: `Load: ${(voltageDiff * 200).toFixed(1)}%`
        };
    });

    // Create network
    const container = document.getElementById('networkContainer');
    const data = {
        nodes: new vis.DataSet(nodes),
        edges: new vis.DataSet(edges)
    };

    const options = {
        layout: {
            improvedLayout: true,
            hierarchical: {
                enabled: true,
                direction: 'LR',
                sortMethod: 'directed',
                levelSeparation: 150
            }
        },
        physics: false,
        nodes: {
            shape: 'dot',
            size: 16,
            font: {
                size: 14
            },
            borderWidth: 2,
            shadow: true
        },
        edges: {
            width: 2,
            shadow: true,
            smooth: {type: 'continuous'}
        },
        interaction: {
            hover: true,
            tooltipDelay: 200
        }
    };

    const network = new vis.Network(container, data, options);

    // Add animation for power flow
    let flowAnimationRunning = true;
    const flowAnimation = () => {
        if (!flowAnimationRunning) return;

        // Animate edges to show power flow
        const updatedEdges = [];
        data.edges.forEach(edge => {
            const newEdge = {...edge};
            newEdge.dashes = [5, 5]; // Make dashed line for animation

            // Use current timestamp for animated dash offset
            const offset = (Date.now() / 100) % 10;
            newEdge.dashOffset = -offset; // Negative for flow from source to destination

            updatedEdges.push(newEdge);
        });

        data.edges.update(updatedEdges);
        requestAnimationFrame(flowAnimation);
    };

    // Start animation
    flowAnimation();

    // Stop animation when leaving page
    window.addEventListener('beforeunload', () => {
        flowAnimationRunning = false;
    });

    return network;
}

// Voltage profile chart with animation
function initializeVoltageChart(sampleId = null) {
    // Create nodes and distances
    const nodes = ['Sub', 'N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'N8', 'N9', 'N10', 'N11', 'N12', 'N13'];
    const distances = [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 2.6, 1.6, 2.1, 2.6, 3.1];

    // Default voltage profile
    let baseVoltages = [1.03, 1.02, 1.014, 1.01, 1.003, 0.995, 0.988, 0.982, 0.976, 0.977, 1.005, 1.0, 0.992, 0.97];

    // Update voltages based on sample
    if (sampleId === 'ieee13') {
        baseVoltages = [1.05, 1.04, 1.02, 0.99, 0.97, 0.96, 0.95, 0.94, 0.938, 0.96, 1.01, 0.98, 0.96, 0.94];
    } else if (sampleId === 'pv_impact') {
        baseVoltages = [1.03, 1.035, 1.04, 1.042, 1.045, 1.048, 1.05, 1.052, 1.038, 1.047, 1.025, 1.03, 1.048, 1.038];
    } else if (sampleId === 'urban_network') {
        baseVoltages = [1.02, 1.01, 1.005, 0.998, 0.989, 0.982, 0.975, 0.968, 0.962, 0.97, 0.995, 0.988, 0.98, 0.975];
    }

    // Create canvas
    const container = document.getElementById('voltageProfileChart');
    container.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Animation variables
    let animationRunning = true;
    let animationTime = 0;
    const animationPeriod = 10000; // 10 seconds for a complete cycle

    function drawVoltageProfile(timestamp) {
        if (!animationRunning) return;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Update animation time
        animationTime = (animationTime + 16) % animationPeriod; // 60fps, roughly 16ms per frame
        const animationProgress = animationTime / animationPeriod;

        // Create dynamic voltage variations
        const voltages = baseVoltages.map((v, i) => {
            // Add sinusoidal variation to simulate load changes
            // Each node has a different phase to create a "wave" effect
            const variation = 0.005 * Math.sin(2 * Math.PI * (animationProgress + i * 0.1));
            return v + variation;
        });

        // Draw grid
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 0.5;

        // Horizontal grid lines (voltage)
        const voltageRange = [0.95, 1.05];
        const voltageStep = 0.01;

        for (let v = voltageRange[0]; v <= voltageRange[1]; v += voltageStep) {
            const y = height - (v - voltageRange[0]) / (voltageRange[1] - voltageRange[0]) * height;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();

            // Label
            ctx.fillStyle = '#666';
            ctx.font = '12px Arial';
            ctx.fillText(v.toFixed(2), 5, y - 5);
        }

        // Draw bounds
        // ANSI C84.1 Range A
        const upperA = height - (1.05 - voltageRange[0]) / (voltageRange[1] - voltageRange[0]) * height;
        const lowerA = height - (0.95 - voltageRange[0]) / (voltageRange[1] - voltageRange[0]) * height;

        ctx.fillStyle = 'rgba(255, 235, 59, 0.1)';
        ctx.fillRect(0, upperA, width, lowerA - upperA);

        ctx.fillStyle = 'rgba(244, 67, 54, 0.1)';
        ctx.fillRect(0, 0, width, upperA);
        ctx.fillRect(0, lowerA, width, height - lowerA);

        // Plot voltage profile
        ctx.strokeStyle = '#0f4880';
        ctx.lineWidth = 3;
        ctx.beginPath();

        const maxDistance = Math.max(...distances);

        for (let i = 0; i < nodes.length; i++) {
            const x = distances[i] / maxDistance * width * 0.9;
            const y = height - (voltages[i] - voltageRange[0]) / (voltageRange[1] - voltageRange[0]) * height;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            // Draw node markers
            ctx.fillStyle = '#0f4880';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.stroke();

        // Add highlight for fluctuating nodes
        const highlightNode = Math.floor(animationProgress * nodes.length);
        if (highlightNode < nodes.length) {
            const x = distances[highlightNode] / maxDistance * width * 0.9;
            const y = height - (voltages[highlightNode] - voltageRange[0]) / (voltageRange[1] - voltageRange[0]) * height;

            // Draw pulsing highlight
            const pulseSize = 4 + 2 * Math.sin(animationProgress * Math.PI * 10);
            ctx.beginPath();
            ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 152, 0, 0.7)';
            ctx.fill();
        }

        // Add labels for problematic nodes
        for (let i = 0; i < nodes.length; i++) {
            if (voltages[i] < 0.98 || voltages[i] > 1.03) {
                const x = distances[i] / maxDistance * width * 0.9;
                const y = height - (voltages[i] - voltageRange[0]) / (voltageRange[1] - voltageRange[0]) * height;

                ctx.fillStyle = voltages[i] < 0.95 || voltages[i] > 1.05 ? '#d32f2f' : '#fbc02d';
                ctx.font = 'bold 12px Arial';
                ctx.fillText(nodes[i], x + 5, y - 8);
                ctx.fillText(voltages[i].toFixed(3) + ' pu', x + 5, y + 15);
            }
        }

        // Add title and labels
        ctx.fillStyle = '#333';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('Distance from Substation (miles)', width / 2 - 100, height - 5);

        ctx.save();
        ctx.translate(15, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Voltage (per unit)', 0, 0);
        ctx.restore();

        // Add time indicator for animation
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        const timeLabel = new Date().toLocaleTimeString();
        ctx.fillText(`Simulation Time: ${timeLabel}`, width - 150, 20);

        // Continue animation
        requestAnimationFrame(drawVoltageProfile);
    }

    // Start animation
    requestAnimationFrame(drawVoltageProfile);

    // Stop animation when leaving page
    window.addEventListener('beforeunload', () => {
        animationRunning = false;
    });
}

// Simulate loading a sample simulation
function loadSampleSimulation(sampleId) {
    // Stop any existing simulation
    if (window.clearSimulation) {
        window.clearSimulation();
    }

    // Show loading indicator
    document.getElementById('loadingIndicator').style.display = 'block';
    document.getElementById('interpretationResults').style.display = 'none';

    // Simulate API call delay
    setTimeout(() => {
        // Hide loading indicator
        document.getElementById('loadingIndicator').style.display = 'none';
        document.getElementById('interpretationResults').style.display = 'block';

        // Update parameter table based on sample
        const parameterTable = document.getElementById('parameterTableBody');

        if (sampleId === 'ieee13') {
            parameterTable.innerHTML = `
                        <tr><td>Base Voltage</td><td>4.16 kV</td><td><span class="status ok">OK</span></td></tr>
                        <tr><td>Power Factor</td><td>0.89</td><td><span class="status warning">Warning</span></td></tr>
                        <tr><td>Voltage Drop</td><td>6.2%</td><td><span class="status error">Error</span></td></tr>
                        <tr><td>Peak Load</td><td>4.9 MVA</td><td><span class="status ok">OK</span></td></tr>
                        <tr><td>Line Losses</td><td>112 kW</td><td><span class="status warning">Warning</span></td></tr>
                    `;
        } else if (sampleId === 'pv_impact') {
            parameterTable.innerHTML = `
                        <tr><td>Base Voltage</td><td>12.47 kV</td><td><span class="status ok">OK</span></td></tr>
                        <tr><td>Power Factor</td><td>0.95</td><td><span class="status ok">OK</span></td></tr>
                        <tr><td>Voltage Rise</td><td>3.8%</td><td><span class="status warning">Warning</span></td></tr>
                        <tr><td>PV Capacity</td><td>2.3 MW</td><td><span class="status ok">OK</span></td></tr>
                        <tr><td>Reverse Power</td><td>Yes</td><td><span class="status warning">Warning</span></td></tr>
                    `;
        } else if (sampleId === 'urban_network') {
            parameterTable.innerHTML = `
                        <tr><td>Base Voltage</td><td>13.8 kV</td><td><span class="status ok">OK</span></td></tr>
                        <tr><td>Power Factor</td><td>0.93</td><td><span class="status ok">OK</span></td></tr>
                        <tr><td>Loading</td><td>89%</td><td><span class="status warning">Warning</span></td></tr>
                        <tr><td>Peak Load</td><td>7.2 MVA</td><td><span class="status ok">OK</span></td></tr>
                        <tr><td>N-1 Capacity</td><td>No</td><td><span class="status error">Error</span></td></tr>
                    `;
        }

        // Update network visualization and voltage profile with the sample ID
        initializeNetwork(sampleId);
        initializeVoltageChart(sampleId);

        // Update interpretation results
        const interpretationResults = document.getElementById('interpretationResults');

        if (sampleId === 'ieee13') {
            interpretationResults.innerHTML = `
          <div class="interpretation-item">
            <h4>Voltage Profile Analysis</h4>
            <p>The IEEE 13-node test feeder shows significant voltage drops exceeding 6% at the end of the feeder, which violates ANSI C84.1 Range A limits. The voltage at node 633 is particularly problematic and requires immediate attention.</p>
          </div>

          <div class="interpretation-item">
            <h4>Power Factor Improvement</h4>
            <p>Power factor of 0.89 indicates substantial room for improvement. Adding 600 kVAR of capacitive compensation at node 675 would improve power factor to 0.97 and reduce losses by approximately 18%.</p>
          </div>

          <div class="interpretation-item">
            <h4>Three-Phase Imbalance</h4>
            <p>Phase imbalance of 15% exceeds recommended limits of 10%. Consider redistributing single-phase loads between phases, especially at nodes 671 and 634.</p>
          </div>

          <div class="reference">
            <strong>Relevant EPRI Research:</strong>
            <a href="#">Technical Report 3002022023: IEEE Test Feeder Analysis</a>
          </div>

          <div class="reference">
            <strong>Relevant EPRI Research:</strong>
            <a href="#">EPRI Journal 2021: Phase Balancing Techniques</a>
          </div>
        `;
        } else if (sampleId === 'pv_impact') {
            interpretationResults.innerHTML = `
          <div class="interpretation-item">
            <h4>Voltage Rise Analysis</h4>
            <p>High PV penetration is causing voltage rise of 3.8% during peak generation periods, approaching the ANSI C84.1 upper limit. The most affected locations are nodes N9 and N12 which are furthest from voltage regulation.</p>
          </div>

          <div class="interpretation-item">
            <h4>Reverse Power Flow</h4>
            <p>Reverse power flow is occurring during low load, high generation periods. Protection schemes should be verified for bidirectional operation, particularly at recloser R3.</p>
          </div>

          <div class="interpretation-item">
            <h4>Hosting Capacity</h4>
            <p>Current PV hosting capacity is 2.8 MW before violations occur. Smart inverter functions (Volt-VAR, Volt-Watt) could increase this by approximately 30% if implemented.</p>
          </div>

          <div class="reference">
            <strong>Relevant EPRI Research:</strong>
            <a href="#">Technical Report 3002015867: PV Hosting Capacity Methods</a>
          </div>

          <div class="reference">
            <strong>Relevant EPRI Research:</strong>
            <a href="#">Guide 3002016696: Smart Inverter Implementation</a>
          </div>
        `;
        } else if (sampleId === 'urban_network') {
            interpretationResults.innerHTML = `
          <div class="interpretation-item">
            <h4>Capacity Constraint Analysis</h4>
            <p>The urban network is approaching capacity limits with 89% loading during peak periods. The main transformer T1 and feeder segments F3-F5 are the primary bottlenecks.</p>
          </div>

          <div class="interpretation-item">
            <h4>N-1 Contingency</h4>
            <p>The network fails N-1 contingency analysis for loss of feeder F2. Load transfer capability to adjacent feeders is limited to 3.2 MVA, leaving 1.8 MVA unserved during contingency.</p>
          </div>

          <div class="interpretation-item">
            <h4>Load Growth Impact</h4>
            <p>Projected load growth of 2.5% annually will exceed capacity within 3 years. Consider accelerating planned substation upgrades or implementing strategic demand management.</p>
          </div>

          <div class="reference">
            <strong>Relevant EPRI Research:</strong>
            <a href="#">Technical Report 3002020619: Urban Network Reinforcement Strategies</a>
          </div>

          <div class="reference">
            <strong>Relevant EPRI Research:</strong>
            <a href="#">EPRI White Paper: Non-Wires Alternatives for Capacity Constraints</a>
          </div>
        `;
        }

        // Start a live data simulation
        startLiveDataSimulation(sampleId);

    }, 2000); // Simulate 2-second processing time
}

// Live data simulation
function startLiveDataSimulation(sampleId) {
    const updateFrequency = 5000; // Update every 5 seconds

    // Create a fluctuating parameter that changes over time
    function updateLiveParameters() {
        const parameterTable = document.getElementById('parameterTableBody');
        if (!parameterTable) return;

        const rows = parameterTable.querySelectorAll('tr');
        if (rows.length === 0) return;

        // Select a random parameter to update (skip first row)
        const randomRowIndex = Math.floor(Math.random() * (rows.length - 1)) + 1;
        const row = rows[randomRowIndex];
        const cells = row.querySelectorAll('td');

        if (cells.length >= 2) {
            const paramName = cells[0].textContent;
            const currentValue = cells[1].textContent;

            // Parse current value
            let numValue = parseFloat(currentValue);
            let unit = currentValue.replace(/[0-9.]/g, '').trim();

            // Check if we can parse a number
            if (!isNaN(numValue)) {
                // Add small random fluctuation
                const fluctuation = (Math.random() - 0.5) * 0.05 * numValue; // ±2.5% variation
                numValue += fluctuation;

                // Update the cell
                cells[1].textContent = numValue.toFixed(2) + ' ' + unit;

                // Check if we crossed a threshold and update status
                const statusCell = cells[2].querySelector('.status');
                if (statusCell) {
                    if (paramName.toLowerCase().includes('voltage')) {
                        if (numValue > 6.0) {
                            statusCell.className = 'status error';
                            statusCell.textContent = 'Error';
                        } else if (numValue > 4.5) {
                            statusCell.className = 'status warning';
                            statusCell.textContent = 'Warning';
                        } else {
                            statusCell.className = 'status ok';
                            statusCell.textContent = 'OK';
                        }
                    } else if (paramName.toLowerCase().includes('factor')) {
                        if (numValue < 0.90) {
                            statusCell.className = 'status warning';
                            statusCell.textContent = 'Warning';
                        } else {
                            statusCell.className = 'status ok';
                            statusCell.textContent = 'OK';
                        }
                    } else if (paramName.toLowerCase().includes('load')) {
                        if (numValue > 90) {
                            statusCell.className = 'status error';
                            statusCell.textContent = 'Error';
                        } else if (numValue > 80) {
                            statusCell.className = 'status warning';
                            statusCell.textContent = 'Warning';
                        } else {
                            statusCell.className = 'status ok';
                            statusCell.textContent = 'OK';
                        }
                    }
                }
            }
        }
    }

    // Add a real-time event log
    function addEventLog() {
        // Create event log section if it doesn't exist
        let eventLogSection = document.getElementById('eventLogSection');
        if (!eventLogSection) {
            const rightColumn = document.querySelector('.right-column');
            if (!rightColumn) return;

            eventLogSection = document.createElement('div');
            eventLogSection.id = 'eventLogSection';
            eventLogSection.className = 'panel';
            eventLogSection.innerHTML = `
          <h2 class="panel-title">Live Events</h2>
          <div id="eventLogContainer" style="max-height: 200px; overflow-y: auto;"></div>
        `;
            rightColumn.appendChild(eventLogSection);
        }

        const eventLogContainer = document.getElementById('eventLogContainer');
        if (!eventLogContainer) return;

        // Generate a random event
        const events = [
            "Voltage fluctuation detected at node N7",
            "Load increased by 5% at node N4",
            "Capacitor bank switched at node N9",
            "Momentary current spike recorded at feeder segment S3-S4",
            "Communication timeout with recloser R2",
            "Power factor improved at substation",
            "DER output variability detected at node N12",
            "Phase imbalance increasing on lateral L2",
            "Temperature alert on transformer T1",
            "Reactive power compensation engaged"
        ];

        const randomEvent = events[Math.floor(Math.random() * events.length)];
        const eventTime = new Date().toLocaleTimeString();

        // Create event element
        const eventElement = document.createElement('div');
        eventElement.style.padding = '8px';
        eventElement.style.borderBottom = '1px solid #eee';
        eventElement.style.fontSize = '13px';
        eventElement.innerHTML = `<strong>${eventTime}</strong>: ${randomEvent}`;

        // Add event to container
        eventLogContainer.insertBefore(eventElement, eventLogContainer.firstChild);

        // Limit to 10 events
        while (eventLogContainer.children.length > 10) {
            eventLogContainer.removeChild(eventLogContainer.lastChild);
        }
    }

    // Add animated load indicators
    function addLoadIndicators() {
        const container = document.querySelector('.container');
        if (!container) return;

        // Create load indicator if it doesn't exist
        let loadIndicator = document.getElementById('networkLoadIndicator');
        if (!loadIndicator) {
            loadIndicator = document.createElement('div');
            loadIndicator.id = 'networkLoadIndicator';
            loadIndicator.style.position = 'fixed';
            loadIndicator.style.top = '10px';
            loadIndicator.style.right = '10px';
            loadIndicator.style.backgroundColor = '#0f4880';
            loadIndicator.style.color = 'white';
            loadIndicator.style.padding = '8px 12px';
            loadIndicator.style.borderRadius = '4px';
            loadIndicator.style.fontSize = '14px';
            loadIndicator.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
            loadIndicator.style.zIndex = '1000';
            container.appendChild(loadIndicator);
        }

        // Update with a random load value
        const baseLoad = sampleId === 'ieee13' ? 4.9 :
            sampleId === 'pv_impact' ? 2.3 :
                sampleId === 'urban_network' ? 7.2 : 3.2;

        const randomFluctuation = (Math.random() - 0.5) * 0.1 * baseLoad; // ±5% variation
        const currentLoad = baseLoad + randomFluctuation;

        loadIndicator.innerHTML = `<strong>Current Load:</strong> ${currentLoad.toFixed(2)} MVA`;

        // Change color based on load level
        if (currentLoad > baseLoad * 1.05) {
            loadIndicator.style.backgroundColor = '#d32f2f';
        } else if (currentLoad < baseLoad * 0.95) {
            loadIndicator.style.backgroundColor = '#2e7d32';
        } else {
            loadIndicator.style.backgroundColor = '#0f4880';
        }
    }

    // Start the simulation updates
    const parameterUpdateInterval = setInterval(updateLiveParameters, updateFrequency);
    const eventLogInterval = setInterval(addEventLog, updateFrequency * 1.7); // slightly different timing
    const loadIndicatorInterval = setInterval(addLoadIndicators, updateFrequency / 2); // faster updates

    // Store the intervals for cleanup
    window.simulationIntervals = window.simulationIntervals || [];
    window.simulationIntervals.push(parameterUpdateInterval, eventLogInterval, loadIndicatorInterval);

    // Cleanup function
    window.clearSimulation = function () {
        if (window.simulationIntervals) {
            window.simulationIntervals.forEach(interval => clearInterval(interval));
            window.simulationIntervals = [];
        }
    };
}

// Initialize network visualization and voltage profile on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeNetwork();
    initializeVoltageChart();

    // Set up analyze button
    document.getElementById('analyzeButton').addEventListener('click', () => {
        // Stop any existing simulation
        if (window.clearSimulation) {
            window.clearSimulation();
        }

        // Show loading indicator
        document.getElementById('loadingIndicator').style.display = 'block';
        document.getElementById('interpretationResults').style.display = 'none';

        // Simulate analysis delay
        setTimeout(() => {
            // Hide loading indicator
            document.getElementById('loadingIndicator').style.display = 'none';
            document.getElementById('interpretationResults').style.display = 'block';

            // Start live data simulation with default parameters
            startLiveDataSimulation();
        }, 3000);
    });

    // Set up file input change handler
    document.getElementById('fileInput').addEventListener('change', (event) => {
        if (event.target.files.length > 0) {
            // Stop any existing simulation
            if (window.clearSimulation) {
                window.clearSimulation();
            }

            // Show loading indicator
            document.getElementById('loadingIndicator').style.display = 'block';
            document.getElementById('interpretationResults').style.display = 'none';

            // Simulate file processing delay
            setTimeout(() => {
                // Hide loading indicator
                document.getElementById('loadingIndicator').style.display = 'none';
                document.getElementById('interpretationResults').style.display = 'block';

                // Update UI as if file was processed
                const file = event.target.files[0];
                alert(`File "${file.name}" processed successfully. Results now displayed.`);

                // Reset file input
                event.target.value = "";

                // Start animation for custom simulation
                initializeNetwork('custom');
                initializeVoltageChart('custom');
                startLiveDataSimulation('custom');
            }, 3000);
        }
    });

    // Make upload area highlight on drag over
    const uploadArea = document.getElementById('uploadArea');

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#0f4880';
        uploadArea.style.backgroundColor = '#f0f7ff';
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '#ccc';
        uploadArea.style.backgroundColor = '';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#ccc';
        uploadArea.style.backgroundColor = '';

        if (e.dataTransfer.files.length > 0) {
            // Stop any existing simulation
            if (window.clearSimulation) {
                window.clearSimulation();
            }

            // Show loading indicator
            document.getElementById('loadingIndicator').style.display = 'block';
            document.getElementById('interpretationResults').style.display = 'none';

            // Simulate file processing delay
            setTimeout(() => {
                // Hide loading indicator
                document.getElementById('loadingIndicator').style.display = 'none';
                document.getElementById('interpretationResults').style.display = 'block';

                // Update UI as if file was processed
                const file = e.dataTransfer.files[0];
                alert(`File "${file.name}" processed successfully. Results now displayed.`);

                // Start animation for custom simulation
                initializeNetwork('custom');
                initializeVoltageChart('custom');
                startLiveDataSimulation('custom');
            }, 3000);
        }
    });

    // Add pulse effect to analyze button
    const analyzeButton = document.getElementById('analyzeButton');
    let pulseInterval;

    function startPulse() {
        let opacity = 1;
        let increasing = false;

        pulseInterval = setInterval(() => {
            if (increasing) {
                opacity += 0.05;
                if (opacity >= 1) {
                    opacity = 1;
                    increasing = false;
                }
            } else {
                opacity -= 0.05;
                if (opacity <= 0.7) {
                    opacity = 0.7;
                    increasing = true;
                }
            }

            analyzeButton.style.opacity = opacity;
        }, 50);
    }

    function stopPulse() {
        clearInterval(pulseInterval);
        analyzeButton.style.opacity = 1;
    }

    // Start pulse after a delay
    setTimeout(startPulse, 5000);

    // Stop pulse on button hover
    analyzeButton.addEventListener('mouseenter', stopPulse);
    analyzeButton.addEventListener('mouseleave', startPulse);

    // Stop pulse when button is clicked
    analyzeButton.addEventListener('click', stopPulse);
});
