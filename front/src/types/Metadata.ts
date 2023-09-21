export interface PeopleMetadata {
    "description": string;
    "external_url": string;
    "image": string;
    "name": string;
    "attributes": [
        {
            "trait_type": "Firstname",
            "value": string;
        },
        {
            "trait_type": "Lastname",
            "value": string;
        },
        {
            "trait_type": "Picture",
            "value": string;
        },
        {
            "trait_type": "Address",
            "value": string;
        }
    ]
}

export interface MovieMetadata {
    "description": string;
    "external_url": string;
    "image": string;
    "name": string;
    "attributes": [
        {
            "trait_type": "Title",
            "value": string;
        },
        {
            "trait_type": "Description",
            "value": string;
        },
        {
            "trait_type": "Picture",
            "value": string;
        },
        {
            "trait_type": "TokenIdDirector",
            "value": number;
        }
    ]
}

export interface AwardMetadata {
    "description": string;
    "external_url": string;
    "image": string;
    "name": string;
    "attributes": [
        {
            "trait_type": "Name",
            "value": string;
        },
        {
            "trait_type": "Picture",
            "value": string;
        }
    ]
}

export interface JuryMetadata {
    "description": string;
    "external_url": string;
    "image": string;
    "name": string;
    "attributes": [
        {
            "trait_type": "Firstname",
            "value": string;
        },
        {
            "trait_type": "Lastname",
            "value": string;
        },
        {
            "trait_type": "Picture",
            "value": string;
        },
        {
            "trait_type": "Address",
            "value": string;
        }
    ]
}
