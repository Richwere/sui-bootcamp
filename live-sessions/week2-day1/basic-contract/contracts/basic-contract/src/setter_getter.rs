use soroban_sdk::{contract, contractimpl, symbol_short, Env, String, Symbol};

#[contract]
pub struct SetterGetter;

const DATA: Symbol = symbol_short!("DATA");

#[contractimpl]
impl SetterGetter {
    pub fn set_data(env: Env, name: String) -> bool {
        env.storage().temporary().set(&DATA, &name);
        true
    }

    pub fn get_data(env: Env) -> bool {
        env.storage()
            .temporary()
            .get(&DATA)
            .unwrap_or(String::from_str(&env, "nil"));
        true
    }
}
