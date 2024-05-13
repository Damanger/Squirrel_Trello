import React, { useEffect } from 'react';

const ParticlesComponent = () => {
    useEffect(() => {
        const script = document.createElement('script');
        script.src = '/node_modules/particles.js/particles.js';
        script.async = true;
        document.body.appendChild(script);

        script.onload = () => {
            window.particlesJS('background', {
                particles: {
                    number: {
                        value: 80,
                        density: {
                            enable: true,
                            value_area: 800,
                        },
                    },
                    color: {
                        value: '#aa00ee',
                    },
                    shape: {
                        type: 'circle',
                        stroke: {
                            width: 0,
                            color: '#000000',
                        },
                        polygon: {
                            nb_sides: 5,
                        },
                    },
                    size: {
                        value: 2
                    },
                    move: {
                        speed: 4
                    }
                },
                interactivity: {
                    detect_on: 'canvas',
                    events: {
                        onhover: {
                            enable: true,
                            mode: 'repulse',
                        },
                        onclick: {
                            enable: true,
                            mode: 'push',
                        },
                    },
                    modes: {
                        repulse: {
                            distance: 100,
                            duration: 0.4,
                        },
                        push: {
                            particles_nb: 4,
                        },
                    },
                },
            });
        };
    }, []);

    return <div id="background" />;
};

export default ParticlesComponent;