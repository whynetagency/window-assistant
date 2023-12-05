export interface IProject {
  id?: string;
  coinDenominations?: string;
  name?:  string;
  phone?:  string;
  email?:  string;
  manager?:  string;
  photos?: string[];
  postedAt?: any;
  isHidden?: boolean;
  isSelected?: boolean;
}
