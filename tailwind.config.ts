import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
               extend: {
                        fontFamily: {
                                sans: ["Inter", "sans-serif"],
                        },
                       fontSize: {
                                h1: ["32px", { lineHeight: "40px" }],
                                h2: ["24px", { lineHeight: "32px" }],
                                h3: ["20px", { lineHeight: "28px" }],
                                body: ["16px", { lineHeight: "24px" }],
                                "body-secondary": ["14px", { lineHeight: "20px" }],
                                action: ["16px", { lineHeight: "24px" }],
                                small: ["12px", { lineHeight: "16px" }],
                        },
                        boxShadow: {
                                focus: "0 0 0 2px rgba(29, 78, 216, 0.5)",
                        },
                        colors: {
                                border: 'hsl(var(--border))',
                                input: 'hsl(var(--input))',
                                ring: 'hsl(var(--ring))',
                                background: 'hsl(var(--background))',
                                foreground: 'hsl(var(--foreground))',
                                primary: {
                                        DEFAULT: 'hsl(var(--primary))',
                                        foreground: 'hsl(var(--primary-foreground))',
                                        hover: 'hsl(var(--primary-hover))'
                                },
                                destructive: {
                                        DEFAULT: 'hsl(var(--destructive))',
                                        foreground: 'hsl(var(--destructive-foreground))',
                                        hover: 'hsl(var(--destructive-hover))'
                                },
                                success: 'hsl(var(--success))',
                                error: 'hsl(var(--error))',
                                warning: 'hsl(var(--warning))',
                                info: 'hsl(var(--info))',
                                muted: {
                                        DEFAULT: 'hsl(var(--muted))',
                                        foreground: 'hsl(var(--muted-foreground))'
                                },
                                accent: {
                                        DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
                                        hover: 'hsl(var(--accent-hover))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				review: {
					success: 'hsl(var(--review-success))',
					warning: 'hsl(var(--review-warning))',
					danger: 'hsl(var(--review-danger))',
					easy: 'hsl(var(--review-easy))',
					medium: 'hsl(var(--review-medium))',
					hard: 'hsl(var(--review-hard))'
				}
			},
			backgroundImage: {
				'review-gradient': 'var(--review-gradient)'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
        plugins: [tailwindcssAnimate],
} satisfies Config;
