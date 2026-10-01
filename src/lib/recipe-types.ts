export type RecipeIngredient={id?:string;name:string;quantity:number|string;unit:string;sortOrder?:number};
export type Recipe={id:string;householdId:string;name:string;description:string|null;servings:number;prepMinutes:number;cookMinutes:number;favorite:boolean;tags:string[];version:number;ingredients:RecipeIngredient[]};
export type RecipeInput={name:string;description:string|null;servings:number;prepMinutes:number;cookMinutes:number;favorite:boolean;tags:string[];ingredients:Array<{name:string;quantity:number;unit:string}>};
