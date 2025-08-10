// Canvas setup
const canvas = document.getElementById('revealCanvas');
let ctx = canvas.getContext('2d');
const backgroundImage = document.getElementById('backgroundImage');

// Canvas dimensions
let canvasWidth = window.innerWidth;
let canvasHeight = window.innerHeight;

// Mouse tracking
let mouseX = 0;
let mouseY = 0;
let isMouseDown = false;
let lastMouseX = 0;
let lastMouseY = 0;

// Touch tracking for mobile devices
let isTouchActive = false;
let lastTouchX = 0;
let lastTouchY = 0;

// Throttling for mouse movement outside canvas area
let lastOutsideUpdate = 0;
let outsideUpdateThrottle = 32; // ~30fps for outside updates (smoother and less CPU intensive)
let isMouseOutsideCanvas = false;

// Canvas-relative mouse coordinates
let canvasMouseX = 0;
let canvasMouseY = 0;

// Helper function to get coordinates from mouse or touch events
function getEventCoordinates(e) {
    if (e.touches && e.touches.length > 0) {
        // Touch event
        const touch = e.touches[0];
        return { x: touch.clientX, y: touch.clientY };
    } else {
        // Mouse event
        return { x: e.clientX, y: e.clientY };
    }
}

// Helper function to detect mobile devices
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           ('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0);
}

// Custom cursor element
let customCursor = null;

// Reveal settings
const revealRadius = 2; // 4px diameter for fine precision
const permanentRevealRadius = 2; // 4px diameter for fine precision

// Store revealed positions in canvas-relative coordinates
let revealedPositions = [];

// Session storage keys
const STORAGE_KEY = 'revelo_revealed_positions';
const STORAGE_VERSION = '1.0';

// Performance optimization
let animationId = null;
let lastTime = 0;
const frameRate = 60;
const frameInterval = 1000 / frameRate;

// Canvas positioning info
let canvasOffsetX = 0;
let canvasOffsetY = 0;

// Initialize canvas
function initCanvas() {
    // Set canvas to a reasonable initial size
    canvas.width = 800;
    canvas.height = 600;
    
    // Ensure canvas context is properly set up
    ctx = canvas.getContext('2d');
    
    // Make canvas completely hidden initially until image loads
    canvas.style.opacity = '0';
    canvas.style.visibility = 'hidden';
    canvas.style.backgroundColor = 'transparent'; // No background, only drawn content
}

// Handle window resize
function handleResize() {
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    initCanvas();
    
    // Reposition canvas frame elements after resize
    if (backgroundImage.style.display !== 'none') {
        showCanvasFrame();
        positionCanvasOverImage();
    } else {
        // If no background image, reposition with default frame
        showCanvasFrameDefault();
    }
    
    drawRevealMask();
}

// Handle mouse movement
function handleMouseMove(e) {
    // Skip if this is a touch event and touch is active (let touch handlers deal with it)
    if (e.touches && e.touches.length > 0 && isTouchActive) {
        return;
    }
    
    const coords = getEventCoordinates(e);
    mouseX = coords.x;
    mouseY = coords.y;
    
    // Only process reveals if mouse is over the image area
    if (backgroundImage.style.display !== 'none') {
        const imgRect = backgroundImage.getBoundingClientRect();
        
        if (coords.x >= imgRect.left && coords.x <= imgRect.right && 
            coords.y >= imgRect.top && coords.y <= imgRect.bottom) {
            
            // Mouse is over image - do full processing
            if (isMouseOutsideCanvas) {
                isMouseOutsideCanvas = false;
            }
            
            // Hide custom cursor when over canvas
            if (customCursor) {
                customCursor.style.display = 'none';
            }
            
            // Convert to canvas-relative coordinates
            canvasMouseX = coords.x - imgRect.left;
            canvasMouseY = coords.y - imgRect.top;
            
            // Add permanent reveal while moving (for drag effect)
            if (isMouseDown) {
                addPermanentReveal(canvasMouseX, canvasMouseY);
            }
            
            // Always add reveal points while moving for smooth effect
            addRevealWhileMoving(canvasMouseX, canvasMouseY);
            
            // Fill gaps between current and last mouse position for fast movement
            if (lastMouseX !== 0 && lastMouseY !== 0) {
                const lastCanvasX = lastMouseX - imgRect.left;
                const lastCanvasY = lastMouseY - imgRect.top;
                fillGapsBetweenPositions(lastCanvasX, lastCanvasY, canvasMouseX, canvasMouseY);
            }
        } else {
            // Mouse is not over image - throttle updates for performance
            if (!isMouseOutsideCanvas) {
                isMouseOutsideCanvas = true;
            }
            
            const now = performance.now();
            if (now - lastOutsideUpdate >= outsideUpdateThrottle) {
                // Show custom cursor
                if (customCursor) {
                    customCursor.style.display = 'block';
                    customCursor.style.left = coords.x + 'px';
                    customCursor.style.top = coords.y + 'px';
                }
                // Reset canvas coordinates
                resetCanvasMouseCoordinates();
                lastOutsideUpdate = now;
            }
            
            // Early return to avoid unnecessary processing when outside canvas
            lastMouseX = mouseX;
            lastMouseY = mouseY;
            return;
        }
    } else {
        // No image loaded yet - throttle updates for performance
        if (!isMouseOutsideCanvas) {
            isMouseOutsideCanvas = true;
        }
        
        const now = performance.now();
        if (now - lastOutsideUpdate >= outsideUpdateThrottle) {
            // Show custom cursor
            if (customCursor) {
                customCursor.style.display = 'block';
                customCursor.style.left = coords.x + 'px';
                customCursor.style.top = coords.y + 'px';
            }
            lastOutsideUpdate = now;
        }
        
        // Early return to avoid unnecessary processing when no image
        lastMouseX = mouseX;
        lastMouseY = mouseY;
        return;
    }
    
    // Update last position (only when processing image area)
    lastMouseX = mouseX;
    lastMouseY = mouseY;
}

// Handle mouse down (for permanent reveals)
function handleMouseDown(e) {
    // Skip if this is a touch event and touch is active (let touch handlers deal with it)
    if (e.touches && e.touches.length > 0 && isTouchActive) {
        return;
    }
    
    isMouseDown = true;
    
    // Only add permanent reveal if mouse is over the image area
    if (backgroundImage.style.display !== 'none') {
        const imgRect = backgroundImage.getBoundingClientRect();
        const coords = getEventCoordinates(e);
        
        if (coords.x >= imgRect.left && coords.x <= imgRect.right && 
            coords.y >= imgRect.top && coords.y <= imgRect.bottom) {
            const canvasX = coords.x - imgRect.left;
            const canvasY = coords.y - imgRect.top;
            addPermanentReveal(canvasX, canvasY);
        }
    }
}

// Handle mouse up
function handleMouseUp() {
    isMouseDown = false;
}

// Handle touch start
function handleTouchStart(e) {
    e.preventDefault(); // Prevent default touch behavior (scrolling, zooming)
    isTouchActive = true;
    
    if (e.touches.length > 0) {
        const touch = e.touches[0];
        lastTouchX = touch.clientX;
        lastTouchY = touch.clientY;
        
        // Only add permanent reveal if touch is over the image area
        if (backgroundImage.style.display !== 'none') {
            const imgRect = backgroundImage.getBoundingClientRect();
            
            if (touch.clientX >= imgRect.left && touch.clientX <= imgRect.right && 
                touch.clientY >= imgRect.top && touch.clientY <= imgRect.bottom) {
                const canvasX = touch.clientX - imgRect.left;
                const canvasY = touch.clientY - imgRect.top;
                addPermanentReveal(canvasX, canvasY);
            }
        }
    }
}

// Handle touch move
function handleTouchMove(e) {
    e.preventDefault(); // Prevent default touch behavior (scrolling, zooming)
    
    if (e.touches.length > 0 && isTouchActive) {
        const touch = e.touches[0];
        const currentX = touch.clientX;
        const currentY = touch.clientY;
        
        // Only process reveals if touch is over the image area
        if (backgroundImage.style.display !== 'none') {
            const imgRect = backgroundImage.getBoundingClientRect();
            
            if (currentX >= imgRect.left && currentX <= imgRect.right && 
                currentY >= imgRect.top && currentY <= imgRect.bottom) {
                
                const canvasX = currentX - imgRect.left;
                const canvasY = currentY - imgRect.top;
                
                // Add reveal at current position
                addRevealWhileMoving(canvasX, canvasY);
                
                // Fill gaps between touch positions for smooth effect
                if (lastTouchX !== 0 && lastTouchY !== 0) {
                    const lastCanvasX = lastTouchX - imgRect.left;
                    const lastCanvasY = lastTouchY - imgRect.top;
                    fillGapsBetweenPositions(lastCanvasX, lastCanvasY, canvasX, canvasY);
                }
                
                lastTouchX = currentX;
                lastTouchY = currentY;
            }
        }
    }
}

// Handle touch end
function handleTouchEnd(e) {
    e.preventDefault(); // Prevent default touch behavior
    isTouchActive = false;
    lastTouchX = 0;
    lastTouchY = 0;
}

// Add permanent reveal at position
function addPermanentReveal(x, y) {
    // Check if position is already revealed (using canvas coordinates)
    const exists = revealedPositions.some(pos => 
        Math.sqrt((pos.x - x) ** 2 + (pos.y - y) ** 2) < permanentRevealRadius * 2
    );
    
    if (!exists) {
        revealedPositions.push({ x, y });
        
        // Save to localStorage periodically (every 10 new positions)
        if (revealedPositions.length % 10 === 0) {
            saveRevealedPositions();
        }
    }
}

// Add reveal while moving (for smooth drag effect)
function addRevealWhileMoving(x, y) {
    // Add reveal with smaller radius for smooth effect
    // Use a small distance check to create fluid trail with minimal lag
    const exists = revealedPositions.some(pos => 
        Math.sqrt((pos.x - x) ** 2 + (pos.y - y) ** 2) < 2
    );
    
    if (!exists) {
        revealedPositions.push({ x, y });
        // No limit - users can reveal the entire image!
        
        // Save to localStorage periodically (every 10 new positions)
        if (revealedPositions.length % 10 === 0) {
            saveRevealedPositions();
        }
    }
}

// Fill gaps between mouse positions for fast movement
function fillGapsBetweenPositions(x1, y1, x2, y2) {
    const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    
    // If distance is large, add intermediate points (less aggressive)
    if (distance > 8) {
        const steps = Math.ceil(distance / 4); // Add points every 4px (less dense)
        
        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            const x = x1 + (x2 - x1) * t;
            const y = y1 + (y2 - y1) * t;
            
            // Add reveal point at intermediate position
            const exists = revealedPositions.some(pos => 
                Math.sqrt((pos.x - x) ** 2 + (pos.y - y) ** 2) < 1
            );
            
            if (!exists) {
                revealedPositions.push({ x, y });
            }
        }
    }
}

// Save revealed positions to localStorage
function saveRevealedPositions() {
    try {
        const data = {
            version: STORAGE_VERSION,
            positions: revealedPositions,
            timestamp: Date.now(),
            imagePath: backgroundImage.src,
            imageModified: window.lastImageModified,
            canvasWidth: canvas.width,
            canvasHeight: canvas.height
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        // Storage might be full or disabled
    }
}

// Load revealed positions from localStorage
function loadRevealedPositions() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const data = JSON.parse(stored);
            
            // Check if it's the same image and recent data
            if (data.version === STORAGE_VERSION && 
                data.imagePath === backgroundImage.src &&
                data.timestamp && 
                (Date.now() - data.timestamp) < (24 * 60 * 60 * 1000)) { // 24 hours
                
                // Check if canvas dimensions match (for coordinate system compatibility)
                if (data.canvasWidth === canvas.width && data.canvasHeight === canvas.height) {
                    revealedPositions = data.positions || [];
                    return true;
                } else {
                    // Canvas dimensions changed, clear old data
                    resetSession();
                    return false;
                }
            }
        }
    } catch (error) {
        // Invalid stored data
    }
    return false;
}

// Reset session storage (clear revealed positions)
function resetSession() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        revealedPositions = [];
    } catch (error) {
        // Error resetting session
    }
}

// Check if sessions should be reset (called periodically)
async function checkSessionReset() {
    try {
        const response = await fetch('/reset-sessions');
        const data = await response.json();
        
        if (data.success && data.reset_required) {
            resetSession();
        }
    } catch (error) {
        // Silently fail - this is just a periodic check
    }
}

// Calculate and update reveal percentage
function updateRevealPercentage() {
    const percentageElement = document.getElementById('revealPercentage');
    if (!percentageElement) return;
    
    if (backgroundImage.style.display !== 'none') {
        // Calculate total area of the canvas (which covers the image)
        const totalArea = canvas.width * canvas.height;
        
        // Calculate revealed area using canvas-relative coordinates
        const revealedArea = revealedPositions.length * Math.PI * Math.pow(permanentRevealRadius, 2);
        
        // Calculate percentage (capped at 100%)
        const percentage = Math.min((revealedArea / totalArea) * 100, 100);
        
        // Update display with 1 decimal place
        percentageElement.textContent = percentage.toFixed(1) + '%';
    } else {
        percentageElement.textContent = '0.0%';
    }
}

// Draw the reveal mask
function drawRevealMask() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Only draw black overlay over the image area, not the entire screen
    if (backgroundImage.style.display !== 'none') {
        // Fill the entire canvas with black overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw all revealed positions (already in canvas coordinates)
        revealedPositions.forEach(pos => {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, permanentRevealRadius, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Draw current mouse reveal hole
        if (canvasMouseX > 0 && canvasMouseY > 0) {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(canvasMouseX, canvasMouseY, revealRadius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Reset composite operation
        ctx.globalCompositeOperation = 'source-over';
    }
    
    // Update reveal percentage
    updateRevealPercentage();
}

// Animation loop
function animate(currentTime) {
    if (currentTime - lastTime >= frameInterval) {
        drawRevealMask();
        lastTime = currentTime;
    }
    
    animationId = requestAnimationFrame(animate);
}

// Reset canvas mouse coordinates
function resetCanvasMouseCoordinates() {
    canvasMouseX = 0;
    canvasMouseY = 0;
}

// Test canvas functionality
function testCanvas() {
    // Test basic drawing
    ctx.fillStyle = 'red';
    ctx.fillRect(10, 10, 50, 50);
    
    // Test reveal effect
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(35, 35, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';
    
    // Test black overlay drawing
    ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
    ctx.fillRect(100, 100, 100, 100);
}

// Initialize everything
function init() {
    // Get custom cursor element
    customCursor = document.getElementById('customCursor');
    
    // Hide custom cursor on mobile devices
    if (isMobileDevice()) {
        if (customCursor) {
            customCursor.style.display = 'none';
        }
        // Add mobile-specific class to body for CSS targeting
        document.body.classList.add('mobile-device');
    }
    
    // Set up canvas
    initCanvas();
    
    // Reset canvas mouse coordinates
    resetCanvasMouseCoordinates();
    
    // Show canvas frame immediately with default positioning
    showCanvasFrameDefault();
    
    // Position canvas in center initially for testing
    canvas.style.position = 'absolute';
    canvas.style.top = '50%';
    canvas.style.left = '50%';
    canvas.style.transform = 'translate(-50%, -50%)';
    canvas.style.zIndex = '20';
    canvas.style.opacity = '0'; // Start hidden until image loads
    
    // Prevent default browser behaviors that might allow dragging
    document.addEventListener('dragstart', function(e) { e.preventDefault(); });
    document.addEventListener('selectstart', function(e) { e.preventDefault(); });
    document.addEventListener('contextmenu', function(e) { e.preventDefault(); });
    
    // Set up event listeners - attach to canvas specifically
    window.addEventListener('resize', handleResize);
    canvas.addEventListener('mousemove', handleMouseMove, { passive: true });
    canvas.addEventListener('mousedown', handleMouseDown, { passive: true });
    canvas.addEventListener('mouseup', handleMouseUp, { passive: true });
    
    // Add touch event listeners for mobile devices
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // Also listen for mouse events on the document for better coverage
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mousedown', handleMouseDown, { passive: true });
    document.addEventListener('mouseup', handleMouseUp, { passive: true });
    
    // Also listen for touch events on the document for better coverage
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // Start animation loop
    animate(0);
}

// Check if background image exists
async function checkImage() {
    try {
        const response = await fetch('/check-image');
        const data = await response.json();
        
        if (data.exists) {
            // Store image modification time for change detection
            window.lastImageModified = data.modified;

            loadBackgroundImage();
            
            // Check for session reset every 30 seconds
            setInterval(checkSessionReset, 30000);
            
            // Periodically update frame position (every 5 seconds) to ensure it stays aligned
            setInterval(() => {
                if (backgroundImage.style.display !== 'none') {
                    showCanvasFrame();
                }
            }, 5000);
        } else {
            // Check again in 2 seconds
            setTimeout(checkImage, 2000);
        }
    } catch (error) {
        // Check again in 2 seconds
        setTimeout(checkImage, 2000);
    }
}

// Load and display background image
function loadBackgroundImage() {
    backgroundImage.onload = function() {
        backgroundImage.style.display = 'block';
        
        // Wait for the browser to finish positioning the image
        setTimeout(() => {
            // Get image dimensions
            const imgRect = backgroundImage.getBoundingClientRect();
            
            // Show and position canvas frame elements
            showCanvasFrame();
            
            // Position and show the canvas overlay over the image area
            positionCanvasOverImage();
            
            // Reset canvas mouse coordinates for new image
            resetCanvasMouseCoordinates();
            
            // Check if this is a new image by comparing with stored image path and modification time
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                try {
                    const data = JSON.parse(stored);
                    if (data.imagePath !== backgroundImage.src || 
                        (window.lastImageModified && data.imageModified !== window.lastImageModified)) {
                        // New image detected - reset session
                        resetSession();
                    }
                } catch (error) {
                    // Invalid stored data - reset session
                    resetSession();
                }
            }
            
            // Try to load saved revealed positions
            if (loadRevealedPositions()) {
                // Loaded saved positions
            }
            
            // Force a redraw after everything is set up
            setTimeout(() => {
                drawRevealMask();
            }, 200);
        }, 50); // Small delay to ensure proper positioning
    };
    
    backgroundImage.onerror = function() {
        // Image failed to load
    };
    
    backgroundImage.src = '/static/images/background.jpg';
}

// Show and position canvas frame elements with default positioning
function showCanvasFrameDefault() {
    const canvasFrame = document.getElementById('canvasFrame');
    const canvasInner = document.getElementById('canvasInner');
    
    if (canvasFrame && canvasInner) {
        // Center the frame in the viewport with larger default dimensions
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        // Use larger default dimensions to ensure image fits
        const frameWidth = Math.min(800, window.innerWidth - 100);
        const frameHeight = Math.min(600, window.innerHeight - 100);
        
        canvasFrame.style.display = 'block';
        canvasFrame.style.position = 'absolute';
        canvasFrame.style.top = (centerY - frameHeight/2) + 'px';
        canvasFrame.style.left = (centerX - frameWidth/2) + 'px';
        canvasFrame.style.width = frameWidth + 'px';
        canvasFrame.style.height = frameHeight + 'px';
        canvasFrame.style.transform = 'none';
        
        canvasInner.style.display = 'block';
        canvasInner.style.position = 'absolute';
        // Center the inner frame within the outer frame (12px border on each side)
        canvasInner.style.top = (centerY - frameHeight/2 + 12) + 'px';
        canvasInner.style.left = (centerX - frameWidth/2 + 12) + 'px';
        canvasInner.style.width = (frameWidth - 24) + 'px'; // Account for 12px border on each side
        canvasInner.style.height = (frameHeight - 24) + 'px';
        canvasInner.style.transform = 'none';
    }
}

// Show and position canvas frame elements
function showCanvasFrame() {
    const canvasFrame = document.getElementById('canvasFrame');
    const canvasInner = document.getElementById('canvasInner');
    
    if (canvasFrame && canvasInner) {
        // Get image dimensions and position
        const imgRect = backgroundImage.getBoundingClientRect();
        
        // Position frame elements to match image boundaries exactly
        canvasFrame.style.display = 'block';
        canvasFrame.style.position = 'absolute';
        canvasFrame.style.top = (imgRect.top - 12) + 'px'; // Extend frame beyond image to show border
        canvasFrame.style.left = (imgRect.left - 12) + 'px'; // Extend frame beyond image to show border
        canvasFrame.style.width = (imgRect.width + 24) + 'px'; // 12px border on each side
        canvasFrame.style.height = (imgRect.height + 24) + 'px';
        canvasFrame.style.transform = 'none'; // Override the translate(-50%, -50%)
        
        canvasInner.style.display = 'block';
        canvasInner.style.position = 'absolute';
        // Center the inner frame within the outer frame (12px border on each side)
        canvasInner.style.top = imgRect.top + 'px'; // Align with image top
        canvasInner.style.left = imgRect.left + 'px'; // Align with image left
        canvasInner.style.width = imgRect.width + 'px'; // Exact image size
        canvasInner.style.height = imgRect.height + 'px';
        canvasInner.style.transform = 'none'; // Override the translate(-50%, -50%)
    }
}

// Position canvas overlay over the image area
function positionCanvasOverImage() {
    if (backgroundImage.style.display !== 'none') {
        const imgRect = backgroundImage.getBoundingClientRect();
        
        // Store canvas offset for coordinate conversion
        canvasOffsetX = imgRect.left; // Canvas is aligned with image boundaries
        canvasOffsetY = imgRect.top; // Canvas is aligned with image boundaries
        
        // Position canvas to cover only the image area
        canvas.style.position = 'absolute';
        canvas.style.top = imgRect.top + 'px'; // Align with image top (frame inner boundary)
        canvas.style.left = imgRect.left + 'px'; // Align with image left (frame inner boundary)
        canvas.style.width = imgRect.width + 'px'; // Use full image size
        canvas.style.height = imgRect.height + 'px'; // Use full image size
        
        // Update canvas dimensions for drawing
        canvas.width = imgRect.width; // Use full image size
        canvas.height = imgRect.height; // Use full image size
        
        // Ensure canvas is visible and properly positioned
        canvas.style.transform = 'none';
        canvas.style.zIndex = '20';
        
        // Verify alignment with image
        const canvasRect = canvas.getBoundingClientRect();
        const alignmentCheck = {
            imageTop: imgRect.top,
            imageLeft: imgRect.left,
            canvasTop: canvasRect.top,
            canvasLeft: canvasRect.left,
            topDiff: Math.abs(imgRect.top - canvasRect.top),
            leftDiff: Math.abs(imgRect.left - canvasRect.left)
        };
        
        // Show canvas immediately without fade effect
        canvas.style.opacity = '1';
        canvas.style.visibility = 'visible';
        canvas.style.backgroundColor = 'transparent'; // No background, only drawn content
        
        // Force a redraw to ensure proper coverage
        setTimeout(() => {
            drawRevealMask();
        }, 100);
    } else {
        // Cannot position canvas: background image not visible
    }
}

// Start everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    init();
    checkImage();
    
    // Show custom cursor initially since no image is loaded yet
    if (customCursor) {
        customCursor.style.display = 'block';
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    // Save revealed positions before leaving
    saveRevealedPositions();
});
