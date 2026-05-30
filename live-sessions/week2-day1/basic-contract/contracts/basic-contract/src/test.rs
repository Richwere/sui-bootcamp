#![cfg(test)]

use crate::setter_getter::{SetterGetter, SetterGetterClient};

use soroban_sdk::{Env, String};

#[test]
fn test() {
    let env = Env::default();
    let contract_id = env.register(SetterGetter, ());
    let client = SetterGetterClient::new(&env, &contract_id);

    let name = String::from_str(&env, "James");
    let data = client.set_data(&name);
    assert!(data)
}

#[test]
fn test_get_data() {
    let env = Env::default();
    let contract_id = env.register(SetterGetter, ());
    let client = SetterGetterClient::new(&env, &contract_id);

    let data = client.get_data();
    assert!(data)
}
