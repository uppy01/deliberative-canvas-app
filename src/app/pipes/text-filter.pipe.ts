import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'textFilter',
	standalone: true,
 })
export class TextFilterPipe implements PipeTransform {

    transform(items: any[], searchValue: string, props: Array<string>): any[] {
		if (!items) return [];
		if (!searchValue) return items;
		
		let filteredItems = [];
		items.forEach(singleItem => {
			let concatenatedPropsData = '';
			props.forEach(prop => {
				concatenatedPropsData += singleItem[prop]
			})
			const isMatch = concatenatedPropsData.toLowerCase().includes(searchValue.toLowerCase())
			isMatch ? filteredItems.push(singleItem) : null ;
			});

		return filteredItems;
	}

}