
import { Country, State } from "country-state-city";

export type CountryData = {
    code: string;
    name: string;
};

export type StateData = {
    code: string;
    name: string;
};

export const getAllCountries = (): CountryData[] => {
    return Country.getAllCountries().map(c => ({
        code: c.isoCode,
        name: c.name
    }));
};

export const getStatesOfCountry = (countryCode: string): StateData[] => {
    return State.getStatesOfCountry(countryCode).map(s => ({
        code: s.isoCode,
        name: s.name
    }));
};

export const countries = getAllCountries();