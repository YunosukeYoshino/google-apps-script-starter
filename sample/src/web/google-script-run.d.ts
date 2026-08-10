type GreetingRunner = {
	withSuccessHandler(handler: (message: string) => void): GreetingRunner;
	withFailureHandler(handler: (error: Error) => void): GreetingRunner;
	getGreeting(name: string): void;
};

declare const google: {
	script: {
		run: GreetingRunner;
	};
};
