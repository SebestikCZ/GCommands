import Logger from 'js-logger';
import {EventEmitter} from 'events';
import {Util} from '../util/Util';

export interface ProviderEvents {
	'connect': (client?: any) => void;
}

export interface ProviderInterface {
	on<U extends keyof ProviderEvents>(
		event: U, listener: ProviderEvents[U]
	): this;
	
	emit<U extends keyof ProviderEvents>(
		event: U, ...args: Parameters<ProviderEvents[U]>
	): boolean;

    init(): Promise<void> | void;
	insert(...args): Promise<any> | any;
    get(...args): Promise<any> | any;
    update(...args): Promise<any> | any;
    delete(...args): Promise<any> | any;
}

const throwError = (error, name) => {
	const trace = Util.resolveValidationErrorTrace([
		name
	]);

	Logger.error(error, trace);
};

export class Provider extends EventEmitter {
	init() {
		throwError('Init method is not implemented!', this.constructor.name);
		return;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	insert(...args) {
		throwError('Insert method is not implemented!', this.constructor.name);
		return;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	get(...args) {
		throwError('Get method is not implemented!', this.constructor.name);
		return;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	update(...args) {
		throwError('Update method is not implemented!', this.constructor.name);
		return;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	delete(...args) {
		throwError('Delete method is not implemented!', this.constructor.name);
		return;
	}
}